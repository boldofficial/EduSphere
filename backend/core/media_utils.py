from django.core.files.storage import default_storage

def get_media_url(path):
    """
    Consistently resolve a media path to a full URL.
    Handles R2/S3 signed URLs and local /media/ fallback.
    """
    if not path:
        return None
    
    # If it's already a full URL, return it
    if str(path).startswith('http'):
        return path
        
    try:
        return default_storage.url(path)
    except Exception:
        return path
