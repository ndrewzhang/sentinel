from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:H0ckeyg0golf@localhost:5432/datasentinel"


    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()