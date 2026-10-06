import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "PolicyGuard"
    DATABASE_URL: str = "sqlite:///./policyguard.db"
    AI_API_KEY: str = ""
    AI_MODEL: str = "gemini-2.5-flash"
    FRONTEND_URL: str = "http://localhost:3000"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
