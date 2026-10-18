"""
Background file exports. A job is queued, the worker writes the file to storage, and the user downloads it
through the API (never a public link). Status lives in the cache for a day; the file itself in storage.
"""

import uuid

from django.core.cache import cache

TTL = 60 * 60 * 24


def _key(job_id):
    return f"export-job:{job_id}"


def create_job(school_id, user_id, filename):
    job_id = uuid.uuid4().hex
    cache.set(
        _key(job_id), {"status": "pending", "school_id": school_id, "user_id": user_id, "filename": filename}, TTL
    )
    return job_id


def get_job(job_id):
    return cache.get(_key(job_id))


def update_job(job_id, **fields):
    job = get_job(job_id) or {}
    job.update(fields)
    cache.set(_key(job_id), job, TTL)
    return job


def job_for_request(job_id, request):
    """The job if it belongs to this user's school, else None (so other schools cannot probe job ids)."""
    job = get_job(job_id)
    if not job or job.get("school_id") != getattr(request.user, "school_id", None):
        return None
    return job
