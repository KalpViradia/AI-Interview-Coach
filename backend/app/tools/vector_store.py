"""
Vector Store Tool — ChromaDB retrieval for question bank.

Local persistent Chroma client, seeded once via seed_chroma.py.
Uses sentence-transformers for local, free embeddings.
"""

import os
import random
import chromadb
from chromadb.utils import embedding_functions
from app.core.config import get_settings
from typing import List, Dict, Any

settings = get_settings()

chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_directory)

# We will store all questions in a single collection
COLLECTION_NAME = "interview_questions"

def get_collection():
    """Retrieve or create the questions collection."""
    try:
        return chroma_client.get_or_create_collection(
            name=COLLECTION_NAME
        )
    except Exception as e:
        if "Embedding function conflict" in str(e) or "embedding function" in str(e).lower():
            print("Embedding function conflict detected. Recreating collection...")
            try:
                chroma_client.delete_collection(COLLECTION_NAME)
            except Exception:
                pass
            return chroma_client.get_or_create_collection(
                name=COLLECTION_NAME
            )
        raise e

def chroma_retrieval_tool(topics: List[str], max_difficulty: int = 5, k: int = 3) -> List[Dict[str, Any]]:
    """
    Retrieve relevant interview questions from ChromaDB based on topics and difficulty.
    
    Args:
        topics (List[str]): Candidate's skills or weak topics to query against.
        max_difficulty (int): The maximum difficulty level acceptable.
        k (int): Number of questions to retrieve.
        
    Returns:
        List of question dictionaries containing text, topic, and difficulty.
    """
    collection = get_collection()
    
    # If the collection is empty, return an empty list gracefully
    if collection.count() == 0:
        print("Warning: ChromaDB collection is empty. Run seed_chroma.py!")
        return []
        
    # Join topics into a search query string
    query_text = " ".join(topics) if topics else "general interview questions"
    
    results = collection.query(
        query_texts=[query_text],
        n_results=20, # Fetch more to filter and shuffle
    )
    
    retrieved_questions = []
    
    if not results['documents'] or not results['documents'][0]:
        return retrieved_questions
        
    # Zip the documents and metadata together
    docs = results['documents'][0]
    metadatas = results['metadatas'][0] if results['metadatas'] else []
    
    filtered = []
    for doc, meta in zip(docs, metadatas):
        diff = meta.get('difficulty', 1)
        if diff <= max_difficulty + 1: # slight leeway for variety
            filtered.append({
                "text": doc,
                "topic": meta.get('topic', 'General'),
                "difficulty": diff
            })
            
    # Shuffle to ensure variety across identical queries
    random.shuffle(filtered)
    
    return filtered[:k]
