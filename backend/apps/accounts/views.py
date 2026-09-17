from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTPDevice, UserRole
from .serializers import UserSerializer, CreateUserSerializer, CustomTokenObtainPairSerializer, OTPVerifySerializer, RegisterFarmerSerializer
from .sms_service import send_sms_otp

class RegisterFarmerView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterFarmerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Issue JWT tokens directly upon successful registration
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['tenant_id'] = None

        return Response({
            'message': 'Farmer registration successful',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Auto-seed initial data if database is empty
        if User.objects.count() == 0:
            try:
                import sys, os
                sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
                from seed_data import seed
                seed()
            except Exception as e:
                print(f"Auto-seed warning: {e}")

        serializer = CustomTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Check if 2FA/MFA is required
        if user.is_mfa_enabled or user.role in [UserRole.SUPER_ADMIN, UserRole.PKPS_ADMIN, UserRole.SECRETARY, UserRole.MANAGER]:
            otp = OTPDevice.generate_otp(user, validity_minutes=5)
            
            # Send SMS via Fast2SMS Service to actual user.mobile stored in database
            sms_target = user.mobile if user.mobile else getattr(settings, 'DEFAULT_TARGET_MOBILE', '')
            sms_response = send_sms_otp(sms_target, otp.code)

            return Response({
                'mfa_required': True,
                'username': user.username,
                'message': sms_response['message'],
                'expires_in_minutes': 5
            }, status=status.HTTP_200_OK)

        # Issue JWT tokens directly
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['tenant_id'] = str(user.tenant.id) if user.tenant else None

        return Response({
            'mfa_required': False,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })

class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        otp_code = serializer.validated_data['otp_code'].strip()

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch active unverified device
        device = OTPDevice.objects.filter(user=user, is_verified=False).order_by('-created_at').first()
        if not device or not device.is_valid():
            return Response({'detail': 'Invalid or expired OTP code. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check code matching
        if device.code != otp_code:
            device.register_failed_attempt()
            remaining_attempts = device.max_attempts - device.attempts
            if remaining_attempts > 0:
                return Response({'detail': f'Invalid OTP code. {remaining_attempts} attempt(s) remaining.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'detail': 'Maximum failed OTP attempts exceeded. OTP has been invalidated.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as verified and single-use
        device.is_verified = True
        device.save()

        # Mark OTP as verified and single-use
        device.is_verified = True
        device.save()

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['tenant_id'] = str(user.tenant.id) if user.tenant else None

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })

class CurrentUserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN]:
            return User.objects.all()
        if user.tenant:
            return User.objects.filter(tenant=user.tenant)
        return User.objects.filter(id=user.id)

    def create(self, request, *args, **kwargs):
        user = request.user
        # Restrict creation permissions
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if user.role not in [UserRole.SUPER_ADMIN, UserRole.PKPS_ADMIN, UserRole.SECRETARY]:
            return Response({'detail': 'You do not have permission to create users.'}, status=status.HTTP_403_FORBIDDEN)

        # Enforce tenant assignment for non-super-admins
        if user.role not in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN]:
            serializer.validated_data['tenant'] = user.tenant

        new_user = serializer.save()
        return Response(UserSerializer(new_user).data, status=status.HTTP_201_CREATED)
