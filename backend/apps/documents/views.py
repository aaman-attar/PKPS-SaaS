from rest_framework import viewsets, permissions
from .models import Document
from .serializers import DocumentSerializer
from apps.tenants.permissions import EnforceTenantIsolation

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return Document.objects.all()
        if user.tenant:
            return Document.objects.filter(tenant=user.tenant)
        return Document.objects.none()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, uploaded_by=self.request.user)
