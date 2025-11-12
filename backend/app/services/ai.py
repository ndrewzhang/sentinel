# backend/app/services/ai.py
from typing import Optional
import os

from ..config import settings

class AINotConfigured(Exception):
    pass

def _require_key() -> str:
    key = settings.OPENAI_API_KEY
    if not key:
        raise AINotConfigured("AI not configured: set OPENAI_API_KEY in backend/.env")
    return key

def llm_complete(prompt: str, *, model: Optional[str] = None) -> str:
    """
    Return the **text string** from the LLM. Never return a dict.
    Raise AINotConfigured (or RuntimeError) on problems.
    """
    provider = (settings.AI_PROVIDER or "openai").lower()
    if provider != "openai":
        raise AINotConfigured(f"Unsupported AI_PROVIDER='{settings.AI_PROVIDER}'. Use 'openai'.")

    _require_key()
    try:
        # OpenAI’s python SDK v1 style
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        mdl = model or (settings.AI_MODEL or "gpt-4o-mini")
        resp = client.chat.completions.create(
            model=mdl,
            messages=[
                {"role": "system", "content": "You are a concise data quality assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )
        text = (resp.choices[0].message.content or "").strip()
        if not text:
            # Ensure we never return {} all the way up
            raise RuntimeError("Empty response from model.")
        return text

    except AINotConfigured:
        raise
    except Exception as e:
        # Bubble up a readable error rather than {}.
        raise RuntimeError(f"LLM call failed: {e}") from e
