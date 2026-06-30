import asyncio
from sqlalchemy.future import select
from app.models.db import async_session
from app.models.schema import InterviewSession

async def main():
    async with async_session() as db:
        result = await db.execute(select(InterviewSession).order_by(InterviewSession.started_at.desc()))
        session = result.scalars().first()
        if session:
            print("Latest session:", session.id)
        else:
            print("No sessions found.")

if __name__ == "__main__":
    asyncio.run(main())
