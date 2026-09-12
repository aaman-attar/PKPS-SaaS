from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.tenants.permissions import EnforceTenantIsolation

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return AuditLog.objects.all()
        if user.tenant:
            return AuditLog.objects.filter(tenant=user.tenant)
        return AuditLog.objects.none()

    @action(detail=False, methods=['get'], url_path='verify-chain')
    def verify_chain(self, request):
        user = request.user
        logs = self.get_queryset().order_by('timestamp')
        
        is_valid = True
        broken_id = None

        prev_h = '0' * 64
        for log in logs:
            if log.previous_hash != prev_h:
                is_valid = False
                broken_id = str(log.id)
                break
            prev_h = log.hash

        return Response({
            'chain_intact': is_valid,
            'total_audited_records': logs.count(),
            'compromised_log_id': broken_id
        })
