from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Member, MemberFamily, MemberLand, MemberAsset, MembershipApplication, ApplicationStatus, MemberStatus, KYCStatus
from .serializers import (
    MemberSerializer, CreateMemberSerializer, MemberFamilySerializer,
    MemberLandSerializer, MemberAssetSerializer, MembershipApplicationSerializer,
    CreateMembershipApplicationSerializer
)
from apps.tenants.permissions import IsPKPSStaff, EnforceTenantIsolation, validate_tenant_object
from apps.audit.services import record_audit

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
                qs = qs.filter(first_name__icontains=search) | qs.filter(member_number__icontains=search) | qs.filter(mobile__icontains=search)
            return qs
        return Member.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'FARMER':
            raise PermissionDenied("Farmers must use the Apply for Membership form.")
        member = serializer.save(tenant=self.request.user.tenant)
        record_audit(self.request.user, 'CREATE_MEMBER', 'MEMBERS', 'Member', member.id, new_values={'member_number': member.member_number})

    def perform_update(self, serializer):
        member = serializer.save()
        record_audit(self.request.user, 'UPDATE_MEMBER', 'MEMBERS', 'Member', member.id)

    @action(detail=True, methods=['post'], url_path='verify-kyc')
    def verify_kyc(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'MANAGER', 'LOAN_OFFICER']:
            raise PermissionDenied("Permission denied to verify KYC.")

        member = self.get_object()
        validate_tenant_object(member, request.user)

        action_type = request.data.get('status', 'VERIFIED') # VERIFIED or REJECTED
        reason = request.data.get('rejection_reason', '')

        if action_type == 'VERIFIED':
            member.is_kyc_verified = True
            member.kyc_status = KYCStatus.VERIFIED
            member.kyc_verified_by = request.user
            member.kyc_verified_at = timezone.now()
        else:
            member.is_kyc_verified = False
            member.kyc_status = KYCStatus.REJECTED
            member.kyc_rejection_reason = reason

        member.save()
        record_audit(request.user, 'KYC_VERIFICATION', 'MEMBERS', 'Member', member.id, new_values={'kyc_status': member.kyc_status})
        return Response({'message': f'KYC status updated to {member.kyc_status}.', 'member': MemberSerializer(member).data})

    @action(detail=True, methods=['get'], url_path='closure-eligibility')
    def closure_eligibility(self, request, pk=None):
        member = self.get_object()
        validate_tenant_object(member, request.user)

        from apps.loans.models import LoanAccount
        from apps.deposits.models import SavingsAccount
        from apps.shares.models import ShareAccount

        active_loans = LoanAccount.objects.filter(member=member, outstanding_principal__gt=0)
        savings_acc = SavingsAccount.objects.filter(member=member).first()
        share_acc = ShareAccount.objects.filter(member=member).first()

        blockers = []
        if active_loans.exists():
            total_due = sum([l.outstanding_principal + l.outstanding_interest for l in active_loans])
            blockers.append(f"Outstanding loan balance: ₹{total_due:,.2f} across {active_loans.count()} active loan account(s).")

        can_close = len(blockers) == 0

        return Response({
            'member_id': str(member.id),
            'member_number': member.member_number,
            'can_close': can_close,
            'blockers': blockers,
            'savings_balance': float(savings_acc.current_balance) if savings_acc else 0.0,
            'share_amount': float(share_acc.total_amount) if share_acc else 0.0,
        })

    @action(detail=True, methods=['post'], url_path='close-membership')
    def close_membership(self, request, pk=None):
        if request.user.role not in ['SUPER_ADMIN', 'SUPPORT_ADMIN', 'PKPS_ADMIN', 'SECRETARY']:
            raise PermissionDenied("Only PKPS Management can close memberships.")

        member = self.get_object()
        validate_tenant_object(member, request.user)

        from apps.loans.models import LoanAccount
        from apps.deposits.models import SavingsAccount
        from apps.shares.models import ShareAccount

        active_loans = LoanAccount.objects.filter(member=member, outstanding_principal__gt=0)
        if active_loans.exists():
            return Response({'detail': 'Cannot close membership with outstanding loan obligations.'}, status=status.HTTP_400_BAD_REQUEST)

        savings_acc = SavingsAccount.objects.filter(member=member).first()
        if savings_acc and savings_acc.current_balance > 0:
            return Response({'detail': f'Cannot close membership with active savings balance (₹{savings_acc.current_balance:,.2f}). Please withdraw savings balance first.'}, status=status.HTTP_400_BAD_REQUEST)

        share_acc = ShareAccount.objects.filter(member=member).first()
        if share_acc and share_acc.total_amount > 0:
            return Response({'detail': f'Cannot close membership with active share capital (₹{share_acc.total_amount:,.2f}). Please liquidate share capital first.'}, status=status.HTTP_400_BAD_REQUEST)

        excess_loans = LoanAccount.objects.filter(member=member, excess_credit__gt=0)
        if excess_loans.exists():
            total_excess = sum(l.excess_credit for l in excess_loans)
            return Response({'detail': f'Cannot close membership with excess credit balance (₹{total_excess:,.2f}). Please refund excess credit first.'}, status=status.HTTP_400_BAD_REQUEST)

        member.status = MemberStatus.CLOSED
        member.save()

        record_audit(request.user, 'CLOSE_MEMBERSHIP', 'MEMBERS', 'Member', member.id)
        return Response({'message': 'Membership closed successfully.', 'member': MemberSerializer(member).data})

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
        app = serializer.save(applicant=self.request.user)
        record_audit(self.request.user, 'APPLY_MEMBERSHIP', 'MEMBERS', 'MembershipApplication', app.id)

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
        if app.status != ApplicationStatus.APPROVED:
            pass # allow re-running if needed

        user = request.user
        if user.role not in ['SUPER_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'MANAGER']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        app.status = ApplicationStatus.APPROVED
        app.verified_by = user
        app.verified_at = timezone.now()
        app.save()

        applicant = app.applicant
        applicant.tenant = app.tenant
        if app.first_name and not applicant.first_name:
            applicant.first_name = app.first_name
        if app.last_name and not applicant.last_name:
            applicant.last_name = app.last_name
        if app.mobile and not applicant.mobile:
            applicant.mobile = app.mobile
        applicant.save()

        member_count = Member.objects.filter(tenant=app.tenant).count() + 1
        member_num = request.data.get('member_number') or f"M-{member_count:06d}"
        resolution_no = request.data.get('board_resolution_no') or app.board_resolution_no or f"RES-{timezone.now().year}-{member_count:04d}"
        resolution_date = request.data.get('board_resolution_date') or app.board_resolution_date or timezone.now().date()
        sb_acc_no = request.data.get('dccb_sb_account_no') or app.dccb_sb_account_no or ''
        folio_no = request.data.get('ledger_folio_no') or app.ledger_folio_no or f"LF-{member_count:04d}"

        member, created = Member.objects.get_or_create(
            user=applicant,
            defaults={
                'tenant': app.tenant,
                'member_number': member_num,
                'first_name': app.first_name,
                'middle_name': app.middle_name,
                'last_name': app.last_name,
                'local_language_name': app.local_language_name,
                'father_name': app.father_name,
                'spouse_name': app.spouse_name,
                'marital_status': app.marital_status,
                'blood_group': app.blood_group,
                'religion': app.religion,
                'caste_category': app.caste_category,
                'qualification': app.qualification,
                'occupation': app.occupation,
                'annual_income': app.annual_income or 0.00,
                'gender': app.gender,
                'dob': app.dob,
                'mobile': app.mobile,
                'email': app.email,
                'aadhaar_number': app.aadhaar_number,
                'is_kyc_verified': True,
                'kyc_status': KYCStatus.VERIFIED,
                'kyc_verified_by': user,
                'kyc_verified_at': timezone.now(),
                'board_resolution_no': resolution_no,
                'board_resolution_date': resolution_date,
                'dccb_sb_account_no': sb_acc_no,
                'ledger_folio_no': folio_no,
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
            member.first_name = app.first_name
            member.middle_name = app.middle_name
            member.last_name = app.last_name
            member.local_language_name = app.local_language_name
            member.father_name = app.father_name
            member.spouse_name = app.spouse_name
            member.marital_status = app.marital_status
            member.blood_group = app.blood_group
            member.religion = app.religion
            member.caste_category = app.caste_category
            member.qualification = app.qualification
            member.occupation = app.occupation
            member.annual_income = app.annual_income or member.annual_income
            member.dccb_sb_account_no = sb_acc_no or member.dccb_sb_account_no
            member.board_resolution_no = resolution_no or member.board_resolution_no
            member.board_resolution_date = resolution_date or member.board_resolution_date
            member.is_kyc_verified = True
            member.kyc_status = KYCStatus.VERIFIED
            member.kyc_verified_by = user
            member.kyc_verified_at = timezone.now()
            member.save()

        if app.land_survey_number:
            MemberLand.objects.get_or_create(
                tenant=app.tenant,
                member=member,
                survey_number=app.land_survey_number,
                defaults={
                    'area_acres': app.land_area_acres or 0.00,
                    'unit': app.land_unit or 'Acres',
                    'rtc_utara_no': app.land_rtc_no or '',
                    'village': app.village or 'Village',
                    'taluk': app.taluk,
                    'district': app.district,
                    'ownership_type': app.land_ownership_type or 'Self Owned',
                    'crop_type': app.land_crop_type or '',
                    'irrigation_type': app.land_irrigation_type or '',
                }
            )

        from apps.deposits.services import ensure_member_financial_accounts
        ensure_member_financial_accounts(member)

        record_audit(user, 'APPROVE_MEMBERSHIP_APPLICATION', 'MEMBERS', 'MembershipApplication', app.id)

        return Response({
            'message': 'Application approved and member activated successfully.',
            'application': MembershipApplicationSerializer(app).data,
            'member': MemberSerializer(member).data
        })

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_application(self, request, pk=None):
        app = self.get_object()
        user = request.user
        if user.role not in ['SUPER_ADMIN', 'PKPS_ADMIN', 'SECRETARY', 'MANAGER']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason', 'Application rejected by PKPS Administrator.')
        app.status = ApplicationStatus.REJECTED
        app.rejection_reason = reason
        app.verified_by = user
        app.verified_at = timezone.now()
        app.save()

        record_audit(user, 'REJECT_MEMBERSHIP_APPLICATION', 'MEMBERS', 'MembershipApplication', app.id)

        return Response({
            'message': 'Application rejected.',
            'application': MembershipApplicationSerializer(app).data
        })
