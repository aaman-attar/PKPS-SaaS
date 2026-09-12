from rest_framework import viewsets, permissions
from .models import CommitteeMeeting
from .serializers import CommitteeMeetingSerializer
from apps.tenants.permissions import EnforceTenantIsolation

class CommitteeMeetingViewSet(viewsets.ModelViewSet):
    queryset = CommitteeMeeting.objects.all()
    serializer_class = CommitteeMeetingSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return CommitteeMeeting.objects.all()
        if user.tenant:
            return CommitteeMeeting.objects.filter(tenant=user.tenant)
        return CommitteeMeeting.objects.none()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
