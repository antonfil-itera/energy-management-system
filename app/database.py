import asyncpg
from typing import Optional
from app.config import settings

class Database:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=5,
            max_size=20
        )

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

    async def fetch_one(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def fetch_all(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def execute(self, query: str, *args):
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)

    async def execute_many(self, query: str, args_list):
        async with self.pool.acquire() as conn:
            return await conn.executemany(query, args_list)

db = Database()
