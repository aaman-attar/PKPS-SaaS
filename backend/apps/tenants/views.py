import hashlib
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Tenant, TenantStatus, SocietyProfile, SocietyAddress,
    SocietyBankAccount, SocietyDocument, SocietyAuthorizedPerson,
    TenantInvitation, Subscription, InvitationStatus
)
from .serializers import (
    TenantSerializer, TenantListSerializer, CreateTenantSerializer,
    TenantStatusUpdateSerializer, PublicTenantSerializer,
    PKPSOnboardingSerializer, SocietyDocumentSerializer
)
from .permissions import IsSuperAdmin
from apps.accounts.models import User, UserRole
from apps.audit.services import record_audit


class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateTenantSerializer
        if self.action == 'list':
            return TenantListSerializer
        return TenantSerializer

    def get_permissions(self):
        if self.action == 'public_list':
            return [permissions.AllowAny()]
        if self.action in [
            'create', 'update', 'partial_update', 'destroy',
            'update_status', 'list', 'onboard', 'approve_tenant',
            'resend_invitation', 'verify_document', 'reject_document'
        ]:
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            qs = Tenant.objects.all()
            # Filters
            q = self.request.query_params.get('q', '')
            district = self.request.query_params.get('district', '')
            status_filter = self.request.query_params.get('status', '')
            plan = self.request.query_params.get('plan', '')
            if q:
                qs = qs.filter(name__icontains=q) | qs.filter(code__icontains=q)
            if district:
                qs = qs.filter(district__icontains=district)
            if status_filter:
                qs = qs.filter(status=status_filter)
            if plan:
                qs = qs.filter(subscription_plan=plan)
            return qs.distinct()
        if user.tenant:
            return Tenant.objects.filter(id=user.tenant.id)
        return Tenant.objects.none()

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='public')
    def public_list(self, request):
        tenants = Tenant.objects.filter(status=TenantStatus.ACTIVE)
        serializer = PublicTenantSerializer(tenants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        tenant = self.get_object()
        serializer = TenantStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = tenant.status
        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')
        tenant.status = new_status
        tenant.save()

        record_audit(
            request.user, f'TENANT_STATUS_{new_status}', 'TENANTS', 'Tenant', tenant.id,
            old_values={'status': old_status},
            new_values={'status': new_status, 'notes': notes}
        )

        return Response({
            'message': f'Tenant status updated to {new_status}',
            'tenant': TenantSerializer(tenant).data
        })

    @action(detail=False, methods=['post'], url_path='onboard', permission_classes=[IsSuperAdmin().__class__])
    def onboard(self, request):
        """
        Full atomic PKPS onboarding. Creates:
          Tenant → SocietyProfile → SocietyAddress → BankAccounts → Documents →
          AuthorizedPerson → PKPS_ADMIN User → TenantInvitation → Subscription
        """
        serializer = PKPSOnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        try:
            with transaction.atomic():
                # 1. Create Tenant
                tenant = Tenant.objects.create(
                    code=d['code'],
                    name=d['name'],
                    society_type=d.get('society_type', 'PACS'),
                    registration_number=d['registration_number'],
                    registration_date=d.get('registration_date'),
                    district=d['district'],
                    taluk=d.get('taluk', ''),
                    state=d.get('state', 'Karnataka'),
                    email=d.get('official_email', ''),
                    contact_number=d.get('official_mobile', ''),
                    subscription_plan=d.get('subscription_plan', 'TRIAL'),
                    status=TenantStatus.APPROVED,
                )

                # 2. Create SocietyProfile
                SocietyProfile.objects.create(
                    tenant=tenant,
                    registration_number=d['registration_number'],
                    registration_date=d.get('registration_date'),
                    registration_authority=d.get('registration_authority', 'Registrar of Cooperative Societies'),
                    society_category=d.get('society_category', ''),
                    pan=d.get('pan', ''),
                    certificate_number=d.get('certificate_number', ''),
                    area_of_operation=d.get('area_of_operation', 'VILLAGE'),
                    operation_villages=d.get('operation_villages', []),
                )

                # 3. Create SocietyAddress
                SocietyAddress.objects.create(
                    tenant=tenant,
                    address_line_1=d['address_line_1'],
                    address_line_2=d.get('address_line_2', ''),
                    village_town=d['village_town'],
                    gram_panchayat=d.get('gram_panchayat', ''),
                    taluk=d.get('address_taluk', d.get('taluk', '')),
                    district=d.get('address_district', d['district']),
                    state=d.get('address_state', 'Karnataka'),
                    pin_code=d['pin_code'],
                    official_mobile=d.get('official_mobile', ''),
                    official_email=d.get('official_email', ''),
                    website=d.get('website', ''),
                    latitude=d.get('latitude'),
                    longitude=d.get('longitude'),
                )

                # 4. Create Bank Accounts
                for bank in d.get('bank_accounts', []):
                    SocietyBankAccount.objects.create(tenant=tenant, **bank)

                # 5. Create Document records (metadata only, file upload is separate)
                for doc in d.get('documents', []):
                    SocietyDocument.objects.create(
                        tenant=tenant,
                        document_type=doc['document_type'],
                        document_name=doc['document_name'],
                        file_url=doc.get('file_url', ''),
                        expiry_date=doc.get('expiry_date'),
                        uploaded_by=request.user,
                    )

                # 6. Create Authorized Person
                if d.get('auth_full_name'):
                    SocietyAuthorizedPerson.objects.create(
                        tenant=tenant,
                        full_name=d['auth_full_name'],
                        designation=d.get('auth_designation', ''),
                        mobile=d.get('auth_mobile', ''),
                        email=d.get('auth_email', ''),
                        id_type=d.get('auth_id_type', ''),
                        id_number=d.get('auth_id_number', ''),
                    )

                # 7. Create PKPS Admin user (inactive until invitation accepted)
                admin_name_parts = d['admin_full_name'].strip().split(' ', 1)
                admin_first = admin_name_parts[0]
                admin_last = admin_name_parts[1] if len(admin_name_parts) > 1 else ''
                admin_username = f"{d['code'].lower()}-admin"

                # Ensure unique username
                base_username = admin_username
                counter = 1
                while User.objects.filter(username=admin_username).exists():
                    admin_username = f"{base_username}-{counter}"
                    counter += 1

                pkps_admin = User.objects.create(
                    username=admin_username,
                    email=d['admin_email'],
                    first_name=admin_first,
                    last_name=admin_last,
                    mobile=d.get('admin_mobile', ''),
                    role=UserRole.PKPS_ADMIN,
                    tenant=tenant,
                    is_active=False,  # Inactive until invitation accepted
                )
                # Set unusable password — admin will set their own via invitation
                pkps_admin.set_unusable_password()
                pkps_admin.save()

                # 8. Generate invitation token (hashed)
                invitation, raw_token = TenantInvitation.generate(
                    tenant=tenant,
                    user=pkps_admin,
                    invited_by=request.user,
                    hours=24
                )

                # 9. Create Subscription
                from datetime import date
                Subscription.objects.create(
                    tenant=tenant,
                    plan=d.get('subscription_plan', 'TRIAL'),
                    start_date=date.today(),
                )

                # 9b. Seed standard cooperative loan products
                from apps.loans.services import seed_default_loan_products
                seed_default_loan_products(tenant)

                # 10. Audit log
                record_audit(
                    request.user, 'TENANT_ONBOARDED', 'TENANTS', 'Tenant', tenant.id,
                    new_values={
                        'code': tenant.code,
                        'name': tenant.name,
                        'admin_email': d['admin_email'],
                        'status': tenant.status,
                    }
                )

                # 11. Send invitation email (simulation — extend with real email service)
                frontend_url = 'http://localhost:5173'
                activation_link = f"{frontend_url}/activate?token={raw_token}&tenant={tenant.code}"

                # TODO: Replace with real email send (Django email backend or SendGrid)
                print(f"[INVITATION] Send to {d['admin_email']}: {activation_link}")

                record_audit(
                    request.user, 'ADMIN_INVITED', 'TENANTS', 'TenantInvitation', invitation.id,
                    new_values={'invited_email': d['admin_email'], 'tenant': tenant.code}
                )

                return Response({
                    'message': 'PKPS Society onboarded successfully. Invitation sent to PKPS Admin.',
                    'tenant': TenantSerializer(tenant).data,
                    'invitation': {
                        'id': str(invitation.id),
                        'invited_email': invitation.invited_email,
                        'expires_at': invitation.expires_at.isoformat(),
                        'status': invitation.status,
                    },
                    # In dev mode, show activation link (remove in production)
                    'dev_activation_link': activation_link,
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve_tenant(self, request, pk=None):
        """Approve tenant and send invitation to PKPS Admin."""
        tenant = self.get_object()

        if tenant.status not in [TenantStatus.SUBMITTED, TenantStatus.UNDER_REVIEW, TenantStatus.DOCUMENTS_PENDING]:
            return Response({'detail': 'Tenant cannot be approved from its current status.'}, status=400)

        with transaction.atomic():
            old_status = tenant.status
            tenant.status = TenantStatus.APPROVED
            tenant.save()

            # Activate PKPS admin user and re-generate invitation if needed
            admin_user = tenant.users.filter(role='PKPS_ADMIN').first()
            if admin_user:
                # Invalidate any old pending invitations
                TenantInvitation.objects.filter(
                    tenant=tenant, status=InvitationStatus.PENDING
                ).update(status=InvitationStatus.REVOKED)

                invitation, raw_token = TenantInvitation.generate(
                    tenant=tenant, user=admin_user, invited_by=request.user, hours=48
                )

                frontend_url = 'http://localhost:5173'
                activation_link = f"{frontend_url}/activate?token={raw_token}&tenant={tenant.code}"
                print(f"[APPROVAL INVITATION] {admin_user.email}: {activation_link}")

                record_audit(
                    request.user, 'TENANT_APPROVED', 'TENANTS', 'Tenant', tenant.id,
                    old_values={'status': old_status},
                    new_values={'status': TenantStatus.APPROVED}
                )

                return Response({
                    'message': 'Tenant approved. Invitation sent to PKPS Admin.',
                    'tenant': TenantSerializer(tenant).data,
                    'dev_activation_link': activation_link,
                })

            record_audit(
                request.user, 'TENANT_APPROVED', 'TENANTS', 'Tenant', tenant.id,
                old_values={'status': old_status},
                new_values={'status': TenantStatus.APPROVED}
            )
            return Response({'message': 'Tenant approved.', 'tenant': TenantSerializer(tenant).data})

    @action(detail=True, methods=['post'], url_path='resend-invitation')
    def resend_invitation(self, request, pk=None):
        """Resend activation invitation to PKPS Admin."""
        tenant = self.get_object()
        admin_user = tenant.users.filter(role='PKPS_ADMIN').first()
        if not admin_user:
            return Response({'detail': 'No PKPS Admin found for this tenant.'}, status=400)

        with transaction.atomic():
            TenantInvitation.objects.filter(
                tenant=tenant, status=InvitationStatus.PENDING
            ).update(status=InvitationStatus.REVOKED)

            invitation, raw_token = TenantInvitation.generate(
                tenant=tenant, user=admin_user, invited_by=request.user, hours=24
            )
            frontend_url = 'http://localhost:5173'
            activation_link = f"{frontend_url}/activate?token={raw_token}&tenant={tenant.code}"
            print(f"[RESEND INVITATION] {admin_user.email}: {activation_link}")

            record_audit(
                request.user, 'INVITATION_RESENT', 'TENANTS', 'TenantInvitation', invitation.id,
                new_values={'invited_email': admin_user.email}
            )

            return Response({
                'message': f'Invitation resent to {admin_user.email}.',
                'dev_activation_link': activation_link,
            })

    @action(detail=True, methods=['post'], url_path='documents/(?P<doc_id>[^/.]+)/verify')
    def verify_document(self, request, pk=None, doc_id=None):
        """Verify a society document."""
        tenant = self.get_object()
        try:
            doc = SocietyDocument.objects.get(id=doc_id, tenant=tenant)
        except SocietyDocument.DoesNotExist:
            return Response({'detail': 'Document not found.'}, status=404)

        doc.status = 'VERIFIED'
        doc.verified_by = request.user
        doc.verified_at = timezone.now()
        doc.rejection_reason = ''
        doc.save()

        record_audit(
            request.user, 'DOCUMENT_VERIFIED', 'TENANTS', 'SocietyDocument', doc.id,
            new_values={'document_name': doc.document_name, 'status': 'VERIFIED'}
        )
        return Response({'message': 'Document verified.', 'document': SocietyDocumentSerializer(doc).data})

    @action(detail=True, methods=['post'], url_path='documents/(?P<doc_id>[^/.]+)/reject')
    def reject_document(self, request, pk=None, doc_id=None):
        """Reject a society document with a reason."""
        tenant = self.get_object()
        try:
            doc = SocietyDocument.objects.get(id=doc_id, tenant=tenant)
        except SocietyDocument.DoesNotExist:
            return Response({'detail': 'Document not found.'}, status=404)

        reason = request.data.get('reason', '')
        if not reason:
            return Response({'detail': 'Rejection reason is required.'}, status=400)

        doc.status = 'REJECTED'
        doc.rejection_reason = reason
        doc.save()

        record_audit(
            request.user, 'DOCUMENT_REJECTED', 'TENANTS', 'SocietyDocument', doc.id,
            new_values={'document_name': doc.document_name, 'status': 'REJECTED', 'reason': reason}
        )
        return Response({'message': 'Document rejected.', 'document': SocietyDocumentSerializer(doc).data})


class ActivateAccountView(APIView):
    """
    PKPS Admin account activation via invitation token.
    POST /api/v1/tenants/activate/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_token = request.data.get('token', '').strip()
        password = request.data.get('password', '').strip()
        confirm_password = request.data.get('confirm_password', '').strip()

        if not raw_token:
            return Response({'detail': 'Invitation token is required.'}, status=400)
        if not password:
            return Response({'detail': 'Password is required.'}, status=400)
        if password != confirm_password:
            return Response({'detail': 'Passwords do not match.'}, status=400)
        if len(password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=400)

        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        try:
            invitation = TenantInvitation.objects.select_related('user', 'tenant').get(token_hash=token_hash)
        except TenantInvitation.DoesNotExist:
            return Response({'detail': 'Invalid or expired invitation link.'}, status=400)

        if not invitation.is_valid():
            return Response({
                'detail': 'This invitation has expired or has already been used. Please contact your SaaS Administrator for a new invitation.'
            }, status=400)

        with transaction.atomic():
            user = invitation.user
            user.set_password(password)
            user.is_active = True
            user.save()

            # Mark invitation as accepted
            invitation.accept()

            # Activate tenant if still in APPROVED or pending review state
            tenant = invitation.tenant
            if tenant.status in [TenantStatus.APPROVED, TenantStatus.SUBMITTED, TenantStatus.UNDER_REVIEW]:
                tenant.status = TenantStatus.ACTIVE
                tenant.save()

            from apps.audit.services import record_audit
            record_audit(
                user, 'ACCOUNT_ACTIVATED', 'ACCOUNTS', 'User', user.id,
                new_values={'tenant': tenant.code, 'status': 'ACTIVE'}
            )

        return Response({
            'message': 'Account activated successfully! You can now log in.',
            'tenant_code': invitation.tenant.code,
            'username': user.username,
        })


class ValidateInvitationView(APIView):
    """
    Validate and preview invitation details before activation.
    GET /api/v1/tenants/invitation/?token=<raw_token>
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        raw_token = request.query_params.get('token', '').strip()
        if not raw_token:
            return Response({'detail': 'Token is required.'}, status=400)

        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        try:
            invitation = TenantInvitation.objects.select_related('user', 'tenant').get(token_hash=token_hash)
        except TenantInvitation.DoesNotExist:
            return Response({'detail': 'Invalid invitation link.'}, status=400)

        if not invitation.is_valid():
            return Response({'detail': 'This invitation has expired or already been used.'}, status=400)

        user = invitation.user
        tenant = invitation.tenant
        return Response({
            'valid': True,
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'tenant_code': tenant.code,
            'tenant_name': tenant.name,
            'expires_at': invitation.expires_at.isoformat(),
        })
