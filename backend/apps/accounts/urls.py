from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, VerifyOTPView, CurrentUserProfileView, UserViewSet,
    RegisterFarmerView, RequestOTPView, FarmerOTPLoginView
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('register/', RegisterFarmerView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),

    # Farmer & General OTP endpoints
    path('otp/request/', RequestOTPView.as_view(), name='request-otp'),
    path('otp/login/', FarmerOTPLoginView.as_view(), name='farmer-otp-login'),
    path('farmer/request-otp/', RequestOTPView.as_view(), name='farmer-request-otp'),
    path('farmer/login-otp/', FarmerOTPLoginView.as_view(), name='farmer-login-otp'),

    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', CurrentUserProfileView.as_view(), name='current-user-profile'),
    path('', include(router.urls)),
]

