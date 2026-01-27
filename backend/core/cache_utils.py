"""
Caching utilities for improving API performance
"""

from functools import wraps
from django.core.cache import cache
from django.utils.decorators import method_decorator
from rest_framework.decorators import action
import hashlib


class CacheKeyBuilder:
    """Build cache keys for different endpoints and filters"""
    
    @staticmethod
    def build_list_key(model_name, school_id=None, **kwargs):
        """Build cache key for list endpoints"""
        key_parts = [f"list:{model_name}"]
        
        if school_id:
            key_parts.append(f"school:{school_id}")
        
        # Add filter parameters to key
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}:{v}")
        
        key_str = ":".join(key_parts)
        return f"api:{hashlib.md5(key_str.encode()).hexdigest()}"
    
    @staticmethod
    def build_detail_key(model_name, pk):
        """Build cache key for detail endpoints"""
        return f"api:{model_name}:{pk}"
    
    @staticmethod
    def get_model_cache_prefix(model_name):
        """Get prefix for invalidating all caches for a model"""
        return f"api:{model_name}:*"


def cache_list_endpoint(timeout=300):
    """
    Decorator to cache list endpoint responses
    
    Usage:
        @cache_list_endpoint(timeout=600)
        def list(self, request, *args, **kwargs):
            # endpoint logic
            pass
    
    Args:
        timeout: Cache timeout in seconds (default: 5 minutes)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            # Build cache key based on query params
            school_id = getattr(request.user, 'school_id', None)
            query_params = {k: v for k, v in request.query_params.items() 
                           if k not in ['page']}  # Exclude pagination
            
            cache_key = CacheKeyBuilder.build_list_key(
                self.queryset.model.__name__,
                school_id=school_id,
                **query_params
            )
            
            # Try to get from cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                # Manually paginate the cached response
                page = request.query_params.get('page', 1)
                return func(self, request, *args, **kwargs)
            
            # Call the actual endpoint
            response = func(self, request, *args, **kwargs)
            
            # Cache the result if it's a successful list response
            if response.status_code == 200 and hasattr(response, 'data'):
                cache.set(cache_key, response.data, timeout)
            
            return response
        
        return wrapper
    return decorator


def invalidate_model_cache(model_name):
    """
    Invalidate all cache entries for a specific model
    
    Usage:
        invalidate_model_cache('Payment')
    
    Args:
        model_name: Name of the model to invalidate cache for
    """
    cache_prefix = CacheKeyBuilder.get_model_cache_prefix(model_name)
    # Note: Exact prefix invalidation depends on cache backend
    # For Redis, you would use: cache.delete_many(cache.keys(cache_prefix))
    # For LocMem, we'll use a manual approach
    pass


class CachingMixin:
    """
    Mixin to add caching capabilities to ViewSets
    
    Automatically invalidates cache on create, update, delete
    """
    
    cache_timeout = 300  # 5 minutes default
    
    def get_cache_key_prefix(self):
        """Get cache key prefix for this ViewSet's model"""
        return f"api:{self.queryset.model.__name__}"
    
    def invalidate_cache(self):
        """Invalidate cache for this model"""
        prefix = self.get_cache_key_prefix()
        # Simple approach: delete specific keys if needed
        # For production with Redis, use: cache.delete_pattern(f"{prefix}:*")
    
    def perform_create(self, serializer):
        """Override to invalidate cache after create"""
        response = super().perform_create(serializer)
        self.invalidate_cache()
        return response
    
    def perform_update(self, serializer):
        """Override to invalidate cache after update"""
        response = super().perform_update(serializer)
        self.invalidate_cache()
        return response
    
    def perform_destroy(self, instance):
        """Override to invalidate cache after delete"""
        response = super().perform_destroy(instance)
        self.invalidate_cache()
        return response


# Cache policies for different data types
CACHE_POLICIES = {
    # Frequently accessed, rarely updated
    'Subject': {
        'timeout': 3600,  # 1 hour
        'invalidate_on_write': True
    },
    'Teacher': {
        'timeout': 1800,  # 30 minutes
        'invalidate_on_write': True
    },
    'Class': {
        'timeout': 1800,
        'invalidate_on_write': True
    },
    'FeeCategory': {
        'timeout': 3600,
        'invalidate_on_write': True
    },
    
    # Medium frequency access
    'Student': {
        'timeout': 600,   # 10 minutes
        'invalidate_on_write': True
    },
    'ReportCard': {
        'timeout': 600,
        'invalidate_on_write': False
    },
    
    # Frequently updated, shorter cache
    'AttendanceRecord': {
        'timeout': 300,   # 5 minutes
        'invalidate_on_write': True
    },
    'Payment': {
        'timeout': 300,
        'invalidate_on_write': True
    },
    
    # Real-time data, minimal caching
    'SchoolMessage': {
        'timeout': 60,    # 1 minute
        'invalidate_on_write': True
    },
    'SchoolEvent': {
        'timeout': 600,
        'invalidate_on_write': True
    },
}


def get_cache_timeout(model_name):
    """Get cache timeout for a specific model"""
    policy = CACHE_POLICIES.get(model_name, {})
    return policy.get('timeout', 300)  # Default 5 minutes
