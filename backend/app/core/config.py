from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SyncDesk"
    
    # JWT Authentication Settings
    SECRET_KEY: str = "gnQySvDUJ0WBLsKGG3tQghAp5fkWQjfRsSnIGCdGinE"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # PostgreSQL Database Credentials
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "1234"
    POSTGRES_DB: str = "syncdesk_db"

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # AI Integration Settings - Must remain None here to read from .env!
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama3-8b-8192"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Dynamically builds the PostgreSQL connection string."""
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Consolidated into a single model_config declaration
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

settings = Settings()