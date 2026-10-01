from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, ActivateAccountView, ValidateInvitationView

router = DefaultRouter()
router.register(r'', TenantViewSet, basename='tenant')

urlpatterns = [
    path('activate/', ActivateAccountView.as_view(), name='activate-account'),
    path('invitation/', ValidateInvitationView.as_view(), name='validate-invitation'),
    path('', include(router.urls)),
]
