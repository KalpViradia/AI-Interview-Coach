import asyncio
from sqlalchemy import text
from app.models.db import engine

async def run_migration():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN session_type VARCHAR(50) DEFAULT 'ats_check'"))
            print("Migration successful: Added session_type")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_migration())
