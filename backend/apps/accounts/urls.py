from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, VerifyOTPView, CurrentUserProfileView, UserViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', CurrentUserProfileView.as_view(), name='current-user-profile'),
    path('', include(router.urls)),
]
