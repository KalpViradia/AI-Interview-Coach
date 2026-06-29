import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.schema import Base
from app.core.config import get_settings

async def create_tables():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Created all tables!")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())
