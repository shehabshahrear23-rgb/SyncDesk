from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SyncDesk API"

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "syncdesk"
    POSTGRES_PORT: str = "5432"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return "sqlite:///./syncdesk.db"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379

    # Auth / JWT
    # Override SECRET_KEY in backend/.env before deploying anywhere:
    #   SECRET_KEY=<output of: python -c "import secrets; print(secrets.token_hex(32))">
    SECRET_KEY: str = "dev-only-secret-change-me-in-env-file-0123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # AI assistant (Groq). The key lives only in backend/.env as GROQ_API_KEY=...
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    class Config:
        env_file = ".env"
        extra = "ignore"  # other lines in .env must not stop the server from starting

settings = Settings()
