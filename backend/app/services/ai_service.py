# backend/app/services/ai_service.py
from typing import List, Dict, Any, Optional
import os

from pydantic import BaseModel

# Provider: OpenAI (sdk v1)
try:
    from openai import OpenAI
except Exception:
    OpenAI = None


class AIConfig(BaseModel):
    provider: str = os.getenv("AI_PROVIDER", "openai")
    model: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    api_key: Optional[str] = os.getenv("AI_API_KEY")


class AIService:
    def __init__(self, cfg: Optional[AIConfig] = None):
        self.cfg = cfg or AIConfig()
        if self.cfg.provider == "openai":
            if not self.cfg.api_key:
                raise RuntimeError("AI_API_KEY not set")
            if OpenAI is None:
                raise RuntimeError("openai SDK not installed")
            self.client = OpenAI(api_key=self.cfg.api_key)
        else:
            raise RuntimeError(f"Unsupported AI_PROVIDER: {self.cfg.provider}")

    def chat(self, messages: List[Dict[str, str]]) -> str:
        # Simple, safe, deterministic-ish call
        resp = self.client.chat.completions.create(
            model=self.cfg.model,
            messages=messages,
            temperature=0.2,
        )
        return resp.choices[0].message.content.strip()
