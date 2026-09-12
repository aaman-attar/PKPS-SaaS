from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AccountHeadViewSet, JournalEntryViewSet

router = DefaultRouter()
router.register(r'heads', AccountHeadViewSet, basename='account-head')
router.register(r'entries', JournalEntryViewSet, basename='journal-entry')

urlpatterns = [
    path('', include(router.urls)),
]
