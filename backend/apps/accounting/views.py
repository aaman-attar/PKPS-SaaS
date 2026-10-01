import uuid
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AccountHead, JournalEntry, JournalLine
from .serializers import (
    AccountHeadSerializer, JournalEntrySerializer, CreateJournalEntrySerializer
)
from apps.tenants.permissions import EnforceTenantIsolation

class AccountHeadViewSet(viewsets.ModelViewSet):
    queryset = AccountHead.objects.all()
    serializer_class = AccountHeadSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return AccountHead.objects.all()
        if user.tenant:
            return AccountHead.objects.filter(tenant=user.tenant)
        return AccountHead.objects.none()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

class JournalEntryViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return JournalEntry.objects.all()
        if user.tenant:
            return JournalEntry.objects.filter(tenant=user.tenant)
        return JournalEntry.objects.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if user.role not in ['ACCOUNTANT', 'SOCIETY_ADMIN', 'SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return Response({'detail': 'Only Accountants or Admins can post manual journal entries.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = CreateJournalEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lines_data = serializer.validated_data['lines']
        narration = serializer.validated_data['narration']

        total_debit = sum(Decimal(str(l['debit'])) for l in lines_data)
        total_credit = sum(Decimal(str(l['credit'])) for l in lines_data)

        if total_debit != total_credit:
            return Response({
                'detail': f'Double-entry validation failed! Total Debit (₹{total_debit}) must equal Total Credit (₹{total_credit}).'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate all account heads exist for user's tenant
        account_ids = [l['account_head_id'] for l in lines_data]
        acct_map = {}
        for acct_id in account_ids:
            try:
                if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
                    acct = AccountHead.objects.get(id=acct_id)
                else:
                    acct = AccountHead.objects.get(id=acct_id, tenant=user.tenant)
                acct_map[acct_id] = acct
            except AccountHead.DoesNotExist:
                return Response({'detail': f'AccountHead {acct_id} does not exist for this tenant.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            entry_no = f"JE-{uuid.uuid4().hex[:8].upper()}"
            target_tenant = user.tenant if user.tenant else list(acct_map.values())[0].tenant
            je = JournalEntry.objects.create(
                tenant=target_tenant,
                entry_number=entry_no,
                narration=narration,
                posted_by=user
            )

            for line in lines_data:
                acct = acct_map[line['account_head_id']]
                JournalLine.objects.create(
                    tenant=target_tenant,
                    journal_entry=je,
                    account_head=acct,
                    debit=line['debit'],
                    credit=line['credit']
                )

        return Response(JournalEntrySerializer(je).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='trial-balance')
    def trial_balance(self, request):
        user = request.user
        if not user.tenant:
            return Response({'detail': 'No tenant associated.'}, status=status.HTTP_400_BAD_REQUEST)

        accounts = AccountHead.objects.filter(tenant=user.tenant)
        results = []
        grand_debit = Decimal(0)
        grand_credit = Decimal(0)

        for acct in accounts:
            debits = JournalLine.objects.filter(tenant=user.tenant, account_head=acct).aggregate(Sum('debit'))['debit__sum'] or Decimal(0)
            credits = JournalLine.objects.filter(tenant=user.tenant, account_head=acct).aggregate(Sum('credit'))['credit__sum'] or Decimal(0)
            
            balance = debits - credits
            grand_debit += debits
            grand_credit += credits

            results.append({
                'id': str(acct.id),
                'code': acct.code,
                'name': acct.name,
                'type': acct.type,
                'debit': debits,
                'credit': credits,
                'net_balance': balance
            })

        return Response({
            'accounts': results,
            'grand_debit': grand_debit,
            'grand_credit': grand_credit,
            'is_balanced': grand_debit == grand_credit
        })
