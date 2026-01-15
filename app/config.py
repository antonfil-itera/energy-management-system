from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://energy_user:energy_password@postgres:5432/energy_db"

    class Config:
        env_file = ".env"

settings = Settings()
