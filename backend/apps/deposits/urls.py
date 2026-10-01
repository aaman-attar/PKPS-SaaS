from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SavingsAccountViewSet, TermDepositViewSet, DepositTransactionViewSet

router = DefaultRouter()
router.register(r'savings', SavingsAccountViewSet, basename='savings-account')
router.register(r'term', TermDepositViewSet, basename='term-deposit')
router.register(r'transactions', DepositTransactionViewSet, basename='deposit-transaction')

urlpatterns = [
    path('', include(router.urls)),
]
