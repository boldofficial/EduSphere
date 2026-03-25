# feat: AI performance indicators in grading module

## Summary
Automated trend analysis integrated into the Grading module to highlight student performance shifts.

## Branch Name
`feature/ai-performance-indicators`

## PR Title
`feat: add AI-driven performance trend indicators to grading module`

---

## What to Build

- Compute per-student grade trend (improving / declining / stable) across recent assessments
- Display badge/indicator on grade list and student profile
- Trigger AI remark generation when a significant shift is detected

## Logic

```python
def compute_trend(scores: list[float]) -> str:
    """
    Expects scores ordered oldest → newest.
    Returns: 'improving' | 'declining' | 'stable'
    """
    if len(scores) < 2:
        return "stable"
    delta = scores[-1] - scores[0]
    if delta >= 5:
        return "improving"
    elif delta <= -5:
        return "declining"
    return "stable"
```

## AI Remark Generation (Multi-Model Fallback)

```python
FALLBACK_MODELS = ["gemini-pro", "llama-3", "qwen-turbo"]

def generate_remark(student, trend):
    for model in FALLBACK_MODELS:
        try:
            return ai_client.generate(model=model, prompt=build_prompt(student, trend))
        except ModelUnavailableError:
            continue
    return "Performance remark unavailable."
```

## UI Indicators

| Trend | Badge Color | Icon |
|-------|-------------|------|
| Improving | Green | ↑ |
| Declining | Red | ↓ |
| Stable | Grey | → |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/grades/trends/?student_id=` | Get trend data for a student |
| GET | `/api/grades/trends/class/?class_id=` | Get trends for entire class |

## Status: Completed (Phase 1, Feature 2)

- [x] Trend fields (`performance_trend`, `ai_performance_remark`) added to `ReportCard` model.
- [x] Automated trend computation implemented in `ReportCard.calculate_trend`.
- [x] Multi-model AI fallback logic (Gemini -> Llama -> Qwen) implemented in `AcademicAI`.
- [x] API endpoints `/api/grades/trends/` and `ReportCardViewSet` actions enabled.
- [x] Frontend `TrendBadge` component developed and integrated.
- [x] Student Profile and Grade List views updated with trend visualization and AI remarks.

## Acceptance Criteria
- [x] Trend badge visible on grade list per student
- [x] Trend computed from last N assessments (configurable, default is historical term averages)
- [x] AI remark generated and stored when trend changes
- [x] Fallback cycles through all available models before giving up
