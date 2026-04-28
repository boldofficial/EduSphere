from django.conf import settings
from django.core.files.storage import default_storage


def get_media_url(path):
    """
    Resolve media path to a full URL.
    Uses /api/media/ route in development for proxy compatibility.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if not path:
        return None
    
    path_str = str(path)
    
    # If it's already a full URL, return as-is
    if path_str.startswith("http"):
        return path_str
    
    # In development, use the Next.js /api/media/ proxy route
    # This ensures media requests go through our dedicated route
    is_debug = getattr(settings, 'DEBUG', False)
    if is_debug:
        clean_path = path_str.lstrip('/')
        # Remove /media/ prefix if present
        if clean_path.startswith('media/'):
            clean_path = clean_path[6:]
        api_media_url = f"/api/media/{clean_path}"
        logger.debug(f"[MEDIA] Dev URL: {api_media_url}")
        return api_media_url
    
    # Production: use standard media URL
    try:
        return default_storage.url(path_str)
    except Exception:
        return f"/media/{path_str.lstrip('/')}"
