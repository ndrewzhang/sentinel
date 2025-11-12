from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., description="SQLAlchemy URL for Postgres")

    # AI settings
    OPENAI_API_KEY: str | None = None
    AI_PROVIDER: str | None = "openai"

    # Read from backend/.env and ignore any unknown keys
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )

settings = Settings()
