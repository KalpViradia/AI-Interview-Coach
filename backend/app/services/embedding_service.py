import logging
import time
from typing import List

from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingGenerationException(Exception):
    """Custom exception raised when embedding generation fails."""
    pass


class EmbeddingService:
    """Centralized service for generating AI text embeddings."""

    _embedder = None

    @classmethod
    def get_embedder(cls) -> GoogleGenerativeAIEmbeddings:
        """Lazy load and return the shared embedding model instance."""
        if cls._embedder is None:
            settings = get_settings()
            try:
                cls._embedder = GoogleGenerativeAIEmbeddings(
                    model=settings.embedding_model,
                    google_api_key=settings.gemini_api_key
                )
                logger.info(f"Initialized EmbeddingService with model: {settings.embedding_model}")
            except Exception as e:
                logger.error(f"Failed to initialize embedding model: {str(e)}")
                raise EmbeddingGenerationException(f"Initialization error: {str(e)}")
        return cls._embedder

    @classmethod
    def embed_query(cls, text: str) -> List[float]:
        """Generate an embedding for a single query string."""
        start_time = time.time()
        try:
            embedder = cls.get_embedder()
            embedding = embedder.embed_query(text)
            
            exec_time = time.time() - start_time
            dimension = len(embedding) if embedding else 0
            
            logger.info(
                f"Embedding Success (Query) | Model: {get_settings().embedding_model} | "
                f"Doc Length: {len(text)} chars | Dimension: {dimension} | "
                f"Time: {exec_time:.3f}s"
            )
            
            return embedding
        except Exception as e:
            exec_time = time.time() - start_time
            logger.error(f"Embedding Failure (Query) | Time: {exec_time:.3f}s | Error: {str(e)}")
            raise EmbeddingGenerationException(f"Embed query failed: {str(e)}")

    @classmethod
    def embed_documents(cls, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of document chunks."""
        start_time = time.time()
        try:
            embedder = cls.get_embedder()
            embeddings = embedder.embed_documents(texts)
            
            exec_time = time.time() - start_time
            dimension = len(embeddings[0]) if embeddings else 0
            total_chars = sum(len(t) for t in texts)
            
            logger.info(
                f"Embedding Success (Batch) | Model: {get_settings().embedding_model} | "
                f"Chunk Count: {len(texts)} | Total Length: {total_chars} chars | "
                f"Dimension: {dimension} | Time: {exec_time:.3f}s"
            )
            
            return embeddings
        except Exception as e:
            exec_time = time.time() - start_time
            logger.error(f"Embedding Failure (Batch) | Time: {exec_time:.3f}s | Error: {str(e)}")
            raise EmbeddingGenerationException(f"Embed documents failed: {str(e)}")
