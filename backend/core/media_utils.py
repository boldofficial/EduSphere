from django.core.files.storage import default_storage

def get_media_url(path):
    """
    Consistently resolve a media path to a full URL.
    Handles R2/S3 signed URLs and local /media/ fallback.
    """
    if not path:
        return None
    
    # If it's already a full URL
    if str(path).startswith('http'):
        # Check if it's a legacy signed URL that should be resolved via default_storage
        # (e.g. contains 'cloudflarestorage.com' and a signature)
        if 'cloudflarestorage.com' in str(path) or '.r2.dev' in str(path):
            # Extract the relative path part
            # Legacy format often looks like: https://<endpoint>/<bucket>/<path>?X-Amz-Algorithm=...
            # We want to extract just the <path> part if possible
            try:
                from urllib.parse import urlparse
                parsed = urlparse(path)
                parts = parsed.path.lstrip('/').split('/')
                # If the first part is the bucket name, skip it
                from django.conf import settings
                bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'multi-school')
                if parts and parts[0] == bucket_name:
                    clean_path = '/'.join(parts[1:])
                else:
                    clean_path = '/'.join(parts)
                
                if clean_path:
                    return default_storage.url(clean_path)
            except Exception:
                pass
        
        return path
        
    try:
        return default_storage.url(path)
    except Exception:
        return path
