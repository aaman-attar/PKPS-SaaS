from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Tenant, TenantStatus
from .serializers import TenantSerializer, CreateTenantSerializer, TenantStatusUpdateSerializer
from .permissions import IsSuperAdmin

class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'update_status', 'list']:
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return Tenant.objects.all()
        if user.tenant:
            return Tenant.objects.filter(id=user.tenant.id)
        return Tenant.objects.none()

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        tenant = self.get_object()
        serializer = TenantStatusUpdateSerializer(data=request.data)
        serializer.is_validate_or_400 = serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        tenant.status = new_status
        tenant.save()

        return Response({
            'message': f'Tenant status updated to {new_status}',
            'tenant': TenantSerializer(tenant).data
        })
