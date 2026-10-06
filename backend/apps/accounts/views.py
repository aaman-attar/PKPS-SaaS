from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, OTPDevice, UserRole
from .serializers import (
    UserSerializer, CreateUserSerializer, CustomTokenObtainPairSerializer,
    OTPVerifySerializer, RegisterFarmerSerializer, RequestOTPSerializer, FarmerOTPLoginSerializer
)
from .sms_provider import get_sms_provider
from .sms_service import send_sms_otp, format_indian_mobile
from apps.tenants.permissions import IsPKPSAdmin, validate_tenant_object
from apps.audit.services import record_audit
from rest_framework.throttling import ScopedRateThrottle

class RequestOTPView(APIView):
    """
    Unified endpoint to request OTP for Login or Registration.
    purpose: 'LOGIN' -> Sends OTP to existing registered farmer/user.
    purpose: 'REGISTRATION' -> Sends verification OTP to new mobile number.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        clean_mobile = serializer.validated_data['mobile']
        purpose = serializer.validated_data.get('purpose', 'LOGIN')

        from django.db.models import Q
        user = User.objects.filter(Q(mobile=clean_mobile) | Q(mobile__endswith=clean_mobile[-10:])).first()

        if purpose == 'LOGIN':
            if not user:
                return Response({
                    'detail': f'No account found with mobile number +91 {clean_mobile}. Please register as a farmer first.'
                }, status=status.HTTP_404_NOT_FOUND)

            if user.is_locked():
                return Response({
                    'detail': 'Account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.'
                }, status=status.HTTP_403_FORBIDDEN)

            try:
                device, raw_otp = OTPDevice.generate_otp(user=user, mobile=clean_mobile, purpose='LOGIN', validity_minutes=5)
            except ValueError as val_err:
                record_audit(user, 'LOGIN_OTP_RATE_LIMITED', 'ACCOUNTS', 'User', user.id)
                return Response({'detail': str(val_err)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

            sms_res = send_sms_otp(clean_mobile, raw_otp)
            record_audit(user, 'LOGIN_OTP_REQUESTED', 'ACCOUNTS', 'User', user.id)

            fast2sms_enabled = getattr(settings, 'FAST2SMS_ENABLED', False)

            if fast2sms_enabled and not sms_res.get('success'):
                err_detail = sms_res.get('message', 'Failed to deliver OTP via SMS.')
                return Response({'detail': err_detail}, status=status.HTTP_400_BAD_REQUEST)

            response_data = {
                'success': True,
                'mobile': clean_mobile,
                'purpose': 'LOGIN',
                'expires_in_minutes': 5,
                'message': f'OTP sent successfully via SMS to +91 {clean_mobile[:2]}******{clean_mobile[-2:]}.'
            }
            if not fast2sms_enabled:
                response_data['dev_otp'] = raw_otp
                response_data['message'] = 'SMS simulation mode active. Enter the 6-digit OTP code below.'

            return Response(response_data, status=status.HTTP_200_OK)

        elif purpose == 'REGISTRATION':
            username = serializer.validated_data.get('username', '').strip()
            if username and User.objects.filter(username__iexact=username).exists():
                return Response({
                    'detail': f"Username '{username}' is already taken. Please choose another username."
                }, status=status.HTTP_400_BAD_REQUEST)

            if user:
                return Response({
                    'detail': f'An account with mobile number +91 {clean_mobile} already exists. Please log in instead.'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                device, raw_otp = OTPDevice.generate_otp(user=None, mobile=clean_mobile, purpose='REGISTRATION', validity_minutes=5)
            except ValueError as val_err:
                return Response({'detail': str(val_err)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

            sms_res = send_sms_otp(clean_mobile, raw_otp)

            fast2sms_enabled = getattr(settings, 'FAST2SMS_ENABLED', False)

            if fast2sms_enabled and not sms_res.get('success'):
                err_detail = sms_res.get('message', 'Failed to deliver OTP via SMS.')
                return Response({'detail': err_detail}, status=status.HTTP_400_BAD_REQUEST)

            response_data = {
                'success': True,
                'mobile': clean_mobile,
                'purpose': 'REGISTRATION',
                'expires_in_minutes': 5,
                'message': f'Verification OTP sent to +91 {clean_mobile[:2]}******{clean_mobile[-2:]}.'
            }
            if not fast2sms_enabled:
                response_data['dev_otp'] = raw_otp
                response_data['message'] = 'SMS simulation mode active. Enter the 6-digit verification code below.'

            return Response(response_data, status=status.HTTP_200_OK)


class FarmerOTPLoginView(APIView):
    """
    Direct passwordless mobile OTP login for Farmers.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp_verify'

    def post(self, request):
        serializer = FarmerOTPLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        clean_mobile = serializer.validated_data['mobile']
        otp_code = serializer.validated_data['otp_code'].strip()

        from django.db.models import Q
        user = User.objects.filter(Q(mobile=clean_mobile) | Q(mobile__endswith=clean_mobile[-10:])).first()
        if not user:
            return Response({'detail': 'No account found with this mobile number.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_locked():
            return Response({'detail': 'Account is temporarily locked. Please try again after 15 minutes.'}, status=status.HTTP_403_FORBIDDEN)

        device = OTPDevice.objects.filter(
            Q(user=user) | Q(mobile=clean_mobile),
            purpose='LOGIN',
            is_verified=False
        ).order_by('-created_at').first()

        if not device or not device.is_valid():
            record_audit(user, 'OTP_VERIFICATION_EXPIRED', 'ACCOUNTS', 'User', user.id)
            return Response({'detail': 'Invalid or expired OTP code. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if not device.verify_input_code(otp_code):
            remaining = device.max_attempts - device.attempts
            record_audit(user, 'OTP_VERIFICATION_FAILED', 'ACCOUNTS', 'User', user.id, new_values={'attempts': device.attempts})
            if remaining > 0:
                return Response({'detail': f'Invalid OTP code. {remaining} attempt(s) remaining.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'detail': 'Maximum failed OTP attempts exceeded. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        user.reset_failed_logins()

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['tenant_id'] = str(user.tenant.id) if user.tenant else None

        record_audit(user, 'LOGIN_SUCCESS_OTP', 'ACCOUNTS', 'User', user.id)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class RegisterFarmerView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = RegisterFarmerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        record_audit(user, 'REGISTER_FARMER_SUCCESS', 'ACCOUNTS', 'User', user.id)

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['tenant_id'] = str(user.tenant.id) if user.tenant else None

        return Response({
            'message': 'Farmer registration successful! Welcome to PKPS.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Check if 2FA/MFA is required (now enforced for all roles including Farmer)
        if user.is_mfa_enabled or user.role in [
            UserRole.SUPER_ADMIN, UserRole.PKPS_ADMIN, UserRole.SECRETARY,
            UserRole.MANAGER, UserRole.FARMER, UserRole.LOAN_OFFICER, UserRole.AUDITOR
        ]:
            try:
                device, raw_otp = OTPDevice.generate_otp(user=user, mobile=user.mobile, purpose='LOGIN', validity_minutes=5)
            except ValueError as val_err:
                record_audit(user, 'LOGIN_OTP_RATE_LIMITED', 'ACCOUNTS', 'User', user.id)
                return Response({'detail': str(val_err)}, status=status.HTTP_429_TOO_MANY_REQUESTS)

            sms_target = user.mobile if user.mobile else getattr(settings, 'DEFAULT_TARGET_MOBILE', '')
            sms_res = send_sms_otp(sms_target, raw_otp)

            fast2sms_enabled = getattr(settings, 'FAST2SMS_ENABLED', False)

            if fast2sms_enabled and not sms_res.get('success'):
                err_detail = sms_res.get('message', 'Failed to deliver OTP via SMS.')
                return Response({'detail': err_detail}, status=status.HTTP_400_BAD_REQUEST)

            if fast2sms_enabled:
                msg = f"OTP code sent via SMS to mobile ending in {sms_target[-4:] if len(sms_target) >= 4 else sms_target}."
                response_data = {
                    'mfa_required': True,
                    'username': user.username,
                    'message': msg,
                    'expires_in_minutes': 5,
                }
            else:
                msg = f"SMS disabled (simulation mode). Your OTP code is shown below."
                response_data = {
                    'mfa_required': True,
                    'username': user.username,
                    'message': msg,
                    'expires_in_minutes': 5,
                    'dev_otp': raw_otp,  # Only included when FAST2SMS_ENABLED=False
                }

            record_audit(user, 'LOGIN_OTP_REQUESTED', 'ACCOUNTS', 'User', user.id)

            return Response(response_data, status=status.HTTP_200_OK)

        # Issue JWT tokens directly
        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['tenant_id'] = str(user.tenant.id) if user.tenant else None

        record_audit(user, 'LOGIN_SUCCESS', 'ACCOUNTS', 'User', user.id)

        return Response({
            'mfa_required': False,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp_verify'

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw_username = serializer.validated_data.get('username', '').strip()
        raw_mobile = serializer.validated_data.get('mobile', '').strip()
        otp_code = serializer.validated_data['otp_code'].strip()

        from django.db.models import Q
        q_filter = Q()
        if raw_username:
            digits_only = ''.join(c for c in raw_username if c.isdigit())
            q_filter |= Q(username__iexact=raw_username) | Q(email__iexact=raw_username) | Q(mobile=raw_username)
            if digits_only:
                q_filter |= Q(mobile=digits_only)
                if len(digits_only) >= 10:
                    q_filter |= Q(mobile__endswith=digits_only[-10:])
        if raw_mobile:
            clean_m = format_indian_mobile(raw_mobile)
            q_filter |= Q(mobile=clean_m) | Q(mobile__endswith=clean_m[-10:])

        user = User.objects.filter(q_filter).first()
        if not user:
            return Response({'detail': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

        device = OTPDevice.objects.filter(
            Q(user=user) | (Q(mobile=user.mobile) if user.mobile else Q()),
            is_verified=False,
            purpose='LOGIN'
        ).order_by('-created_at').first()

        # Fallback to any unverified device for user if purpose wasn't set
        if not device:
            device = OTPDevice.objects.filter(user=user, is_verified=False).order_by('-created_at').first()

        if not device or not device.is_valid():
            record_audit(user, 'OTP_VERIFICATION_EXPIRED', 'ACCOUNTS', 'User', user.id)
            return Response({'detail': 'Invalid or expired OTP code. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if not device.verify_input_code(otp_code):
            remaining_attempts = device.max_attempts - device.attempts
            record_audit(user, 'OTP_VERIFICATION_FAILED', 'ACCOUNTS', 'User', user.id, new_values={'attempts': device.attempts})
            if remaining_attempts > 0:
                return Response({'detail': f'Invalid OTP code. {remaining_attempts} attempt(s) remaining.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'detail': 'Maximum failed OTP attempts exceeded. OTP has been invalidated.'}, status=status.HTTP_400_BAD_REQUEST)

        user.reset_failed_logins()

        refresh = RefreshToken.for_user(user)
        refresh['role'] = user.role
        refresh['tenant_id'] = str(user.tenant.id) if user.tenant else None

        record_audit(user, 'OTP_VERIFICATION_SUCCESS', 'ACCOUNTS', 'User', user.id)

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
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if user.role not in [UserRole.SUPER_ADMIN, UserRole.PKPS_ADMIN, UserRole.SECRETARY]:
            raise PermissionDenied("Permission denied to create user accounts.")

        if user.role not in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN]:
            serializer.validated_data['tenant'] = user.tenant

        new_user = serializer.save()
        record_audit(user, 'CREATE_USER', 'ACCOUNTS', 'User', new_user.id, new_values={'username': new_user.username, 'role': new_user.role})
        return Response(UserSerializer(new_user).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.PKPS_ADMIN]:
            raise PermissionDenied("Permission denied to modify user accounts.")
        res = super().update(request, *args, **kwargs)
        record_audit(request.user, 'UPDATE_USER', 'ACCOUNTS', 'User', kwargs.get('pk'))
        return res

    def partial_update(self, request, *args, **kwargs):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.PKPS_ADMIN]:
            raise PermissionDenied("Permission denied to modify user accounts.")
        res = super().partial_update(request, *args, **kwargs)
        record_audit(request.user, 'UPDATE_USER', 'ACCOUNTS', 'User', kwargs.get('pk'))
        return res

    @action(detail=True, methods=['post'], url_path='activate')
    def activate_user(self, request, pk=None):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.PKPS_ADMIN]:
            raise PermissionDenied("Permission denied to activate users.")
        target_user = self.get_object()
        validate_tenant_object(target_user, request.user)

        target_user.is_active = True
        target_user.save()
        record_audit(request.user, 'ACTIVATE_USER', 'ACCOUNTS', 'User', target_user.id)
        return Response({'message': f'User {target_user.username} activated.', 'user': UserSerializer(target_user).data})

    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate_user(self, request, pk=None):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.PKPS_ADMIN]:
            raise PermissionDenied("Permission denied to deactivate users.")
        target_user = self.get_object()
        validate_tenant_object(target_user, request.user)

        target_user.is_active = False
        target_user.save()
        record_audit(request.user, 'DEACTIVATE_USER', 'ACCOUNTS', 'User', target_user.id)
        return Response({'message': f'User {target_user.username} deactivated.', 'user': UserSerializer(target_user).data})

    @action(detail=True, methods=['post'], url_path='change-role')
    def change_role(self, request, pk=None):
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.PKPS_ADMIN]:
            raise PermissionDenied("Permission denied to change user roles.")
        target_user = self.get_object()
        validate_tenant_object(target_user, request.user)

        new_role = request.data.get('role')
        if new_role not in UserRole.values:
            return Response({'detail': 'Invalid role choice.'}, status=status.HTTP_400_BAD_REQUEST)

        # Non-super-admins cannot assign SUPER_ADMIN or SUPPORT_ADMIN
        if request.user.role not in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN] and new_role in [UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN]:
            raise PermissionDenied("Cannot assign SaaS Admin roles.")

        old_role = target_user.role
        target_user.role = new_role
        target_user.save()

        record_audit(request.user, 'CHANGE_USER_ROLE', 'ACCOUNTS', 'User', target_user.id, old_values={'role': old_role}, new_values={'role': new_role})
        return Response({'message': f'Role updated to {new_role}.', 'user': UserSerializer(target_user).data})
