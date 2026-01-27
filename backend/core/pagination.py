from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class StandardPagination(PageNumberPagination):
    """
    Standard pagination for lists with ~50 items per page.
    Allows clients to override page_size using 'page_size' query parameter.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })

class LargePagination(StandardPagination):
    """
    Large pagination for exports or large lists with ~100 items per page.
    """
    page_size = 100
    max_page_size = 500
