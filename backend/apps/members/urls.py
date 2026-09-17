from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MemberViewSet, MembershipApplicationViewSet

router = DefaultRouter()
router.register(r'applications', MembershipApplicationViewSet, basename='membership-application')
router.register(r'', MemberViewSet, basename='member')

urlpatterns = [
    path('', include(router.urls)),
]

