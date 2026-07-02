from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings
import uuid
import os
import hashlib
import logging

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from google import genai
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Persistent ChromaDB client for resume embeddings.
persist_dir = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_db")
chroma_client = chromadb.PersistentClient(path=persist_dir)
from app.services.embedding_service import EmbeddingService

import time

class ChatSessionMemory:
    def __init__(self, max_history=10):
        self.history: List[Dict[str, str]] = []
        self.max_history = max_history

    def add_message(self, role: str, content: str):
        self.history.append({"role": role, "content": content})
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]
            
    def get_history_str(self) -> str:
        if not self.history:
            return "No previous conversation."
        
        formatted = []
        for msg in self.history:
            role = "User" if msg["role"] == "user" else "Assistant"
            formatted.append(f"{role}:\n{msg['content']}")
        return "\n\n".join(formatted)

class ResumeRAGService:
    """RAG service for resume chat.
    
    Embeddings are now keyed by a content hash of the resume text rather than
    by ephemeral session IDs. This means the same resume uploaded multiple
    times (or selected from the vault multiple times) will reuse existing
    embeddings instead of re-computing them, saving Gemini embedding API calls.
    
    Chat sessions still use ephemeral session IDs for conversational memory.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.client = genai.Client(api_key=self.settings.gemini_api_key)
        self.chat_sessions: Dict[str, tuple[ChatSessionMemory, float]] = {}
        # Maps session_id → collection_name so answer_query can look up the right collection
        self._session_to_collection: Dict[str, str] = {}

    def get_session_memory(self, session_id: str) -> ChatSessionMemory:
        if session_id in self.chat_sessions:
            mem, _ = self.chat_sessions[session_id]
            self.chat_sessions[session_id] = (mem, time.time())
            return mem
            
        mem = ChatSessionMemory(max_history=10)
        self.chat_sessions[session_id] = (mem, time.time())
        
        # LRU eviction
        if len(self.chat_sessions) > 1000:
            oldest = min(self.chat_sessions.keys(), key=lambda k: self.chat_sessions[k][1])
            del self.chat_sessions[oldest]
            
        return mem

    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Simple sliding window chunker."""
        chunks = []
        start = 0
        text_len = len(text)
        
        while start < text_len:
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap
            
        return chunks

    @staticmethod
    def _content_hash(text: str) -> str:
        """Generate a short, stable hash of the resume text for collection naming."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

    async def ingest_resume(self, session_id: str, text: str) -> str:
        """Chunks resume text, embeds it, and stores it in a content-addressed collection.
        
        If the same resume text has already been embedded (based on content hash),
        the existing collection is reused — ZERO embedding API calls.
        
        Returns the collection name for downstream use.
        """
        content_hash = self._content_hash(text)
        collection_name = f"resume_{content_hash}"
        
        # Register session → collection mapping
        self._session_to_collection[session_id] = collection_name
        
        # Check if collection already exists with data
        collection = chroma_client.get_or_create_collection(name=collection_name)
        
        if collection.count() > 0:
            logger.info(
                f"Resume embeddings REUSED for collection {collection_name} "
                f"(session {session_id[:8]}..., {collection.count()} chunks already exist)"
            )
            return collection_name
        
        # First time seeing this resume content — chunk and embed
        chunks = self._chunk_text(text)
        
        if not chunks:
            return collection_name
            
        logger.info(
            f"Resume embeddings GENERATING for collection {collection_name} "
            f"(session {session_id[:8]}..., {len(chunks)} chunks)"
        )
        
        # Generate embeddings
        embeddings = EmbeddingService.embed_documents(chunks)
        
        # Generate IDs
        ids = [f"chunk_{i}" for i in range(len(chunks))]
        
        # Insert into Chroma
        collection.add(
            embeddings=embeddings,
            documents=chunks,
            ids=ids
        )
        
        return collection_name
        
    async def answer_query(self, session_id: str, query: str) -> str:
        """Retrieves relevant chunks and generates an answer."""
        collection_name = self._session_to_collection.get(session_id)
        
        if not collection_name:
            # Fallback: try the old session-based naming convention
            collection_name = f"resume_{session_id.replace('-', '_')}"
        
        try:
            collection = chroma_client.get_collection(name=collection_name)
        except Exception:
            return "Resume not found or expired. Please upload your resume again."
            
        # Embed query
        query_embedding = EmbeddingService.embed_query(query)
        
        # Query Chroma
        n_results = min(3, collection.count())
        if n_results == 0:
            return "The uploaded resume seems to be empty or could not be parsed."

        results = collection.query(
            query_embeddings=query_embedding,
            n_results=n_results
        )
        
        context_docs = results['documents'][0] if results and 'documents' in results and results['documents'] else []
        context_str = "\n\n".join(context_docs)
        
        # Get conversational memory
        memory = self.get_session_memory(session_id)
        history_str = memory.get_history_str()
        
        prompt = f"""You are an AI Interview Coach helping a candidate prepare based on their resume.
Use the provided Resume Context to answer the user accurately.
You also have access to the Conversation History for context regarding previous questions or answers.
If the answer is not in the context, do not make it up—simply state that you don't have that information.

Resume Context:
{context_str}

Conversation History:
{history_str}

Current User Message:
{query}

Answer concisely and professionally. Format your response using Markdown, using bullet points, numbered lists, or bold text where appropriate to make it easy to read:"""

        response = await self.client.aio.models.generate_content(
            model=self.settings.chat_model,
            contents=prompt
        )
        answer = response.text.strip()
        
        # Append to history
        memory.add_message("user", query)
        memory.add_message("assistant", answer)
        
        return answer

rag_service = ResumeRAGService()
