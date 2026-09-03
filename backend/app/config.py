import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str = os.environ.get("SUPABASE_URL", "")
    supabase_service_role_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    class Config:
        env_file = ".env"

settings = Settings()
