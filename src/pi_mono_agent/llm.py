from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Protocol
from urllib import request


class LLMClient(Protocol):
    """Interface for model providers used by the pi-mono pipeline."""

    def complete(self, prompt: str, *, stage: str) -> str:
        """Generate output for a prompt."""


@dataclass(slots=True)
class LLMSettings:
    provider: str = "mock"
    model: str = "gpt-4.1-mini"
    api_key: str | None = None
    base_url: str = "https://api.openai.com/v1/responses"


class MockLLMClient:
    """Deterministic local provider for tests and offline dry-runs."""

    def complete(self, prompt: str, *, stage: str) -> str:
        snippet = prompt.strip().splitlines()[0][:120] if prompt.strip() else ""
        return f"[MOCK:{stage}] {snippet}" if snippet else f"[MOCK:{stage}]"


class OpenAIResponsesClient:
    """Minimal OpenAI Responses API adapter with no third-party dependencies."""

    def __init__(self, settings: LLMSettings) -> None:
        self._settings = settings
        self._api_key = settings.api_key or os.getenv("OPENAI_API_KEY")
        if not self._api_key:
            raise ValueError("OPENAI_API_KEY is required when provider=openai")

    def complete(self, prompt: str, *, stage: str) -> str:
        payload = {
            "model": self._settings.model,
            "input": [
                {
                    "role": "system",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "You are the pi-mono skill extraction engine. Return only the requested stage output.",
                        }
                    ],
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": f"Stage: {stage}\n\n{prompt}",
                        }
                    ],
                },
            ],
        }
        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            self._settings.base_url,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
            },
        )
        with request.urlopen(req) as resp:
            raw = json.loads(resp.read().decode("utf-8"))

        output_text = raw.get("output_text")
        if output_text:
            return output_text

        outputs = raw.get("output", [])
        chunks: list[str] = []
        for output in outputs:
            for item in output.get("content", []):
                text = item.get("text")
                if text:
                    chunks.append(text)
        return "\n".join(chunks).strip()


def build_llm_client(settings: LLMSettings) -> LLMClient:
    provider = settings.provider.lower().strip()
    if provider == "mock":
        return MockLLMClient()
    if provider == "openai":
        return OpenAIResponsesClient(settings)
    raise ValueError(f"Unsupported provider '{settings.provider}'. Use one of: mock, openai")
