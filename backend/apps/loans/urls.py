from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoanProductViewSet, LoanApplicationViewSet, LoanAccountViewSet

router = DefaultRouter()
router.register(r'products', LoanProductViewSet, basename='loan-product')
router.register(r'applications', LoanApplicationViewSet, basename='loan-application')
router.register(r'accounts', LoanAccountViewSet, basename='loan-account')

urlpatterns = [
    path('', include(router.urls)),
]
