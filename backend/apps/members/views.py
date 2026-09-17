from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Member, MemberFamily, MemberLand, MemberAsset, MembershipApplication, ApplicationStatus, MemberStatus
from .serializers import (
    MemberSerializer, CreateMemberSerializer, MemberFamilySerializer,
    MemberLandSerializer, MemberAssetSerializer, MembershipApplicationSerializer,
    CreateMembershipApplicationSerializer
)
from apps.tenants.permissions import IsPKPSStaff, EnforceTenantIsolation

class MemberViewSet(viewsets.ModelViewSet):

    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_serializer_class(self):
        if self.action in ['create']:
            return CreateMemberSerializer
        return MemberSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return Member.objects.all()
        if user.role == 'FARMER':
            return Member.objects.filter(user=user)
        if user.tenant:
            qs = Member.objects.filter(tenant=user.tenant)
            search = self.request.query_params.get('search', None)
            if search:
                qs = qs.filter(
                    first_name__icontains=search
                ) | qs.filter(
                    member_number__icontains=search
                ) | qs.filter(
                    mobile__icontains=search
                )
            return qs
        return Member.objects.none()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'], url_path='add-family')
    def add_family(self, request, pk=None):
        member = self.get_object()
        serializer = MemberFamilySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=member.tenant, member=member)
        return Response(MemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='add-land')
    def add_land(self, request, pk=None):
        member = self.get_object()
        serializer = MemberLandSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=member.tenant, member=member)
        return Response(MemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='add-asset')
    def add_asset(self, request, pk=None):
        member = self.get_object()
        serializer = MemberAssetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=member.tenant, member=member)
        return Response(MemberSerializer(member).data, status=status.HTTP_201_CREATED)

class MembershipApplicationViewSet(viewsets.ModelViewSet):
    queryset = MembershipApplication.objects.all()
    serializer_class = MembershipApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateMembershipApplicationSerializer
        return MembershipApplicationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return MembershipApplication.objects.all()
        if user.role == 'FARMER':
            return MembershipApplication.objects.filter(applicant=user)
        if user.tenant:
            return MembershipApplication.objects.filter(tenant=user.tenant)
        return MembershipApplication.objects.none()

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

    @action(detail=False, methods=['get'], url_path='my-application')
    def my_application(self, request):
        app = MembershipApplication.objects.filter(applicant=request.user).order_by('-created_at').first()
        if not app:
            return Response({'has_application': False, 'application': None})
        return Response({
            'has_application': True,
            'application': MembershipApplicationSerializer(app).data
        })

    @action(detail=True, methods=['post'], url_path='approve')
    def approve_application(self, request, pk=None):
        app = self.get_object()
        if app.status != ApplicationStatus.PENDING:
            return Response({'detail': f'Application is already {app.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.role not in ['SUPER_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'MANAGER']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        # 1. Update application status
        app.status = ApplicationStatus.APPROVED
        app.verified_by = user
        app.verified_at = timezone.now()
        app.save()

        # 2. Update farmer user's tenant assignment
        applicant = app.applicant
        applicant.tenant = app.tenant
        if app.first_name and not applicant.first_name:
            applicant.first_name = app.first_name
        if app.last_name and not applicant.last_name:
            applicant.last_name = app.last_name
        if app.mobile and not applicant.mobile:
            applicant.mobile = app.mobile
        applicant.save()

        # 3. Create or link Member profile
        member_count = Member.objects.filter(tenant=app.tenant).count() + 1
        member_num = f"M-{member_count:06d}"

        member, created = Member.objects.get_or_create(
            user=applicant,
            defaults={
                'tenant': app.tenant,
                'member_number': member_num,
                'first_name': app.first_name,
                'last_name': app.last_name,
                'father_name': app.father_name,
                'gender': app.gender,
                'dob': app.dob,
                'mobile': app.mobile,
                'email': app.email,
                'aadhaar_number': app.aadhaar_number,
                'is_kyc_verified': True,
                'address': app.address,
                'village': app.village,
                'taluk': app.taluk,
                'district': app.district,
                'state': app.state,
                'pincode': app.pincode,
                'status': MemberStatus.ACTIVE
            }
        )
        if not created:
            member.tenant = app.tenant
            member.status = MemberStatus.ACTIVE
            member.save()

        # 4. Create land record if land survey number is specified
        if app.land_survey_number:
            MemberLand.objects.get_or_create(
                tenant=app.tenant,
                member=member,
                survey_number=app.land_survey_number,
                defaults={
                    'area_acres': app.land_area_acres or 0.00,
                    'village': app.village or 'Village',
                    'taluk': app.taluk,
                    'district': app.district,
                    'ownership_type': 'Self Owned'
                }
            )

        return Response({
            'message': 'Application approved and member activated successfully.',
            'application': MembershipApplicationSerializer(app).data,
            'member': MemberSerializer(member).data
        })

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_application(self, request, pk=None):
        app = self.get_object()
        if app.status != ApplicationStatus.PENDING:
            return Response({'detail': f'Application is already {app.status}.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.role not in ['SUPER_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'MANAGER']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason', 'Application rejected by PKPS Administrator.')
        app.status = ApplicationStatus.REJECTED
        app.rejection_reason = reason
        app.verified_by = user
        app.verified_at = timezone.now()
        app.save()

        return Response({
            'message': 'Application rejected.',
            'application': MembershipApplicationSerializer(app).data
        })

