from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShareAccountViewSet, ShareTransactionViewSet, DividendRecordViewSet

router = DefaultRouter()
router.register(r'accounts', ShareAccountViewSet, basename='share-account')
router.register(r'transactions', ShareTransactionViewSet, basename='share-transaction')
router.register(r'dividends', DividendRecordViewSet, basename='dividend-record')

urlpatterns = [
    path('', include(router.urls)),
]
