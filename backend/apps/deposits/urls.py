from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SavingsAccountViewSet, TermDepositViewSet

router = DefaultRouter()
router.register(r'savings', SavingsAccountViewSet, basename='savings-account')
router.register(r'term', TermDepositViewSet, basename='term-deposit')

urlpatterns = [
    path('', include(router.urls)),
]
