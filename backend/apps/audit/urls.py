from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, BlockchainViewSet

router = DefaultRouter()
router.register(r'logs', AuditLogViewSet, basename='audit-log')
router.register(r'blockchain', BlockchainViewSet, basename='audit-blockchain')

urlpatterns = [
    path('', include(router.urls)),
]
