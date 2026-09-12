from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommitteeMeetingViewSet

router = DefaultRouter()
router.register(r'meetings', CommitteeMeetingViewSet, basename='committee-meeting')

urlpatterns = [
    path('', include(router.urls)),
]
