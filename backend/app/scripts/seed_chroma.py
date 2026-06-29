"""
Script to seed ChromaDB with interview questions from question_bank.json.
Should be run once to populate the local vector database.
"""

import os
import sys
import json
import uuid

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.tools.vector_store import get_collection

def seed_database():
    print("Initializing ChromaDB collection...")
    collection = get_collection()
    
    # Check if already seeded
    count = collection.count()
    if count > 0:
        print(f"Collection already contains {count} questions. Skipping seed.")
        return

    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "question_bank.json")
    
    print(f"Reading questions from {data_path}...")
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            questions = data.get("questions", [])
    except Exception as e:
        print(f"Error reading question bank: {e}")
        return
        
    if not questions:
        print("No questions found in question_bank.json.")
        return

    print(f"Found {len(questions)} questions. Embedding and storing into ChromaDB...")
    
    docs = []
    metadatas = []
    ids = []
    
    for idx, q in enumerate(questions):
        docs.append(q["text"])
        metadatas.append({
            "topic": q["topic"],
            "difficulty": q["difficulty"]
        })
        ids.append(f"q_{idx}_{uuid.uuid4().hex[:8]}")
        
    # Add to collection
    collection.add(
        documents=docs,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"Successfully seeded {len(questions)} questions into ChromaDB.")

if __name__ == "__main__":
    seed_database()
