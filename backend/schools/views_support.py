from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SupportTicket, TicketResponse
from .serializers import SupportTicketSerializer, TicketResponseSerializer

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'SUPER_ADMIN':
            return SupportTicket.objects.all().prefetch_related('responses', 'responses__user', 'school', 'user')
        
        if not user.school:
             return SupportTicket.objects.none()
             
        # School admins only see their own school's tickets
        return SupportTicket.objects.filter(school=user.school).prefetch_related('responses', 'responses__user', 'school', 'user')

    def perform_create(self, serializer):
        # Auto-assign school and user
        serializer.save(
            user=self.request.user,
            school=self.request.user.school,
            status='open'
        )

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get('message')
        if not message:
            return Response({"detail": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        is_admin_response = (request.user.role == 'SUPER_ADMIN')
        
        response = TicketResponse.objects.create(
            ticket=ticket,
            user=request.user,
            message=message,
            is_admin_response=is_admin_response
        )
        
        # Update ticket status if it's an admin response and ticket was open
        if is_admin_response and ticket.status == 'open':
            ticket.status = 'in_progress'
            ticket.save()
            
        return Response(TicketResponseSerializer(response).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        # Only super admin or the original requester can resolve
        if request.user.role != 'SUPER_ADMIN' and ticket.user != request.user:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        ticket.status = 'resolved'
        ticket.save()
        return Response(SupportTicketSerializer(ticket).data)
