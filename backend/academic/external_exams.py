"""
External exam results: how a school's candidates did.

WAEC/NECO/NABTEB grade each subject A1–F9; a credit is C6 or better, and the figure schools are
judged by is "5 credits including English Language and Mathematics" (what university admission
needs). BECE grades are similar with a pass at P (or C/credit). JAMB is a single score out of 400.
"""

CREDIT_GRADES = {"A1", "B2", "B3", "C4", "C5", "C6"}
PASS_GRADES = CREDIT_GRADES | {"D7", "E8"}
ENGLISH = {"english", "english language", "english lang"}
MATHS = {"mathematics", "maths", "general mathematics", "math"}

GRADE_BODIES = {"WAEC", "NECO", "NABTEB"}
SCORE_BODIES = {"JAMB", "COMMON_ENTRANCE"}


def normal_grade(value):
    return str(value or "").strip().upper().replace(" ", "")


def _is(subject, names):
    return subject.strip().lower() in names


def candidate_summary(body, results):
    """Per candidate: credits, passes, whether English and Maths are credits, the 5-credit rule, score."""
    if body in SCORE_BODIES:
        scores = []
        for value in results.values():
            try:
                scores.append(float(value))
            except (TypeError, ValueError):
                continue
        return {"score": sum(scores) if scores else None}
    grades = {subject: normal_grade(grade) for subject, grade in results.items() if normal_grade(grade)}
    credits = [s for s, g in grades.items() if g in CREDIT_GRADES]
    english = any(_is(s, ENGLISH) for s in credits)
    maths = any(_is(s, MATHS) for s in credits)
    return {
        "credits": len(credits),
        "passes": sum(1 for g in grades.values() if g in PASS_GRADES),
        "english_credit": english,
        "maths_credit": maths,
        "five_credits_with_english_maths": len(credits) >= 5 and english and maths,
    }


def exam_summary(exam, candidates):
    """School-level figures for the exam's results page."""
    with_results = [c for c in candidates if c.results]
    summaries = [candidate_summary(exam.body, c.results) for c in with_results]
    out = {
        "candidates": len(candidates),
        "with_results": len(with_results),
        "withheld": sum(1 for c in candidates if c.status == "withheld"),
    }
    if exam.body in SCORE_BODIES:
        scores = [s["score"] for s in summaries if s["score"] is not None]
        out.update(
            {
                "average_score": round(sum(scores) / len(scores), 1) if scores else None,
                "highest_score": max(scores) if scores else None,
                "scored_200_plus": sum(1 for s in scores if s >= 200),
            }
        )
        return out
    five = sum(1 for s in summaries if s["five_credits_with_english_maths"])
    out.update(
        {
            "five_credits_with_english_maths": five,
            "five_credits_rate": round(100 * five / len(summaries), 1) if summaries else None,
            "english_credit_rate": (
                round(100 * sum(s["english_credit"] for s in summaries) / len(summaries), 1) if summaries else None
            ),
            "maths_credit_rate": (
                round(100 * sum(s["maths_credit"] for s in summaries) / len(summaries), 1) if summaries else None
            ),
        }
    )
    # Subject by subject: how many sat it and how many got a credit.
    per_subject = {}
    for c in with_results:
        for subject, grade in c.results.items():
            g = normal_grade(grade)
            if not g:
                continue
            row = per_subject.setdefault(subject, {"subject": subject, "sat": 0, "credits": 0})
            row["sat"] += 1
            row["credits"] += g in CREDIT_GRADES
    out["subjects"] = sorted(
        ({**row, "credit_rate": round(100 * row["credits"] / row["sat"], 1)} for row in per_subject.values()),
        key=lambda r: (-r["credit_rate"], r["subject"]),
    )
    return out
