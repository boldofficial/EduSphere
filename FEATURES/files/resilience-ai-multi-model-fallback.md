# feat: AI multi-model fallback resilience

## Summary
The AI remark generation service automatically cycles through alternative models when the primary model is unavailable, ensuring remark generation never fails.

## Branch Name
`feature/ai-multi-model-fallback`

## PR Title
`feat: add multi-model fallback chain to AI remark generation service`

---

## What to Build

- Ordered fallback chain of AI models
- Retry logic that catches model-level failures and tries the next provider
- Logging of which model ultimately served the request
- Hard timeout per model attempt to prevent cascade delays
- Graceful degradation if all models fail

## Fallback Service

```python
# services/ai_remarks.py
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

FALLBACK_CHAIN = [
    {"provider": "google",    "model": "gemini-1.5-flash"},
    {"provider": "groq",      "model": "llama-3.1-8b-instant"},
    {"provider": "openrouter","model": "qwen/qwen-2.5-72b-instruct"},
    {"provider": "openrouter","model": "mistralai/mistral-7b-instruct"},
]

MODEL_TIMEOUT = 8  # seconds per attempt

def generate_remark(prompt: str, context: dict) -> Optional[str]:
    full_prompt = build_prompt(prompt, context)

    for entry in FALLBACK_CHAIN:
        provider = entry["provider"]
        model = entry["model"]
        start = time.time()
        try:
            client = get_client(provider)
            response = client.generate(model=model, prompt=full_prompt, timeout=MODEL_TIMEOUT)
            elapsed = round(time.time() - start, 2)
            logger.info(f"AI remark served by {provider}/{model} in {elapsed}s")
            return response.text
        except Exception as e:
            elapsed = round(time.time() - start, 2)
            logger.warning(f"AI model {provider}/{model} failed after {elapsed}s: {e}")
            continue

    logger.error("All AI models in fallback chain failed.")
    return None


def build_prompt(base_prompt: str, context: dict) -> str:
    return f"""
You are an academic performance analyst for a school management system.
Student: {context.get('student_name')}
Term: {context.get('term')}
Subject: {context.get('subject')}
Score: {context.get('score')}
Trend: {context.get('trend')}

{base_prompt}

Write a brief, constructive performance remark in 2-3 sentences.
""".strip()
```

## Client Factory

```python
# services/ai_clients.py
def get_client(provider: str):
    if provider == "google":
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        return GeminiClient(genai)
    elif provider == "groq":
        from groq import Groq
        return GroqClient(Groq(api_key=settings.GROQ_API_KEY))
    elif provider == "openrouter":
        return OpenRouterClient(api_key=settings.OPENROUTER_API_KEY)
    raise ValueError(f"Unknown provider: {provider}")
```

## Celery Task Integration

```python
@shared_task(bind=True, max_retries=0)
def generate_grade_remark(self, grade_id: int):
    grade = Grade.objects.select_related("student", "subject", "term").get(pk=grade_id)
    remark = generate_remark(
        prompt="Generate a constructive remark for this student's performance.",
        context={
            "student_name": grade.student.full_name,
            "term": str(grade.term),
            "subject": grade.subject.name,
            "score": grade.score,
            "trend": grade.trend,
        }
    )
    if remark:
        grade.ai_remark = remark
        grade.save(update_fields=["ai_remark"])
```

## Model

```python
# Add to Grade model
ai_remark = models.TextField(blank=True)
ai_model_used = models.CharField(max_length=100, blank=True)  # for audit
```

## Fallback Chain Summary

| Priority | Provider | Model | Notes |
|----------|----------|-------|-------|
| 1 | Google | gemini-1.5-flash | Primary |
| 2 | Groq | llama-3.1-8b-instant | Fast, free tier |
| 3 | OpenRouter | qwen-2.5-72b | Strong secondary |
| 4 | OpenRouter | mistral-7b-instruct | Last resort |

## Acceptance Criteria
- [ ] Primary model (Gemini) used when available
- [ ] Failure of one model silently falls to the next without crashing
- [ ] Each model attempt respects the 8-second timeout
- [ ] Model that served the response is logged and stored on the grade record
- [ ] Graceful `None` returned (no exception raised) if all models fail
- [ ] Warning log emitted for each failed model; error log if chain is exhausted
