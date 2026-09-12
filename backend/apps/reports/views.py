from decimal import Decimal
from django.db.models import Sum, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.members.models import Member
from apps.loans.models import LoanAccount, LoanRepayment, LoanApplication
from apps.shares.models import ShareAccount
from apps.deposits.models import SavingsAccount, TermDeposit
from apps.accounting.models import AccountHead, JournalLine
from apps.tenants.models import Tenant

class DashboardMetricsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # SaaS Super Admin Dashboard Data
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            total_tenants = Tenant.objects.count()
            active_tenants = Tenant.objects.filter(status='ACTIVE').count()
            pending_tenants = Tenant.objects.filter(status='PENDING').count()
            total_members = Member.objects.count()
            total_loans_disbursed = LoanAccount.objects.aggregate(Sum('disbursed_amount'))['disbursed_amount__sum'] or Decimal(0)
            
            return Response({
                'system_role': 'SUPER_ADMIN',
                'total_tenants': total_tenants,
                'active_tenants': active_tenants,
                'pending_tenants': pending_tenants,
                'total_members': total_members,
                'total_loans_disbursed': total_loans_disbursed
            })

        # PKPS Staff Dashboard Data
        if not user.tenant:
            return Response({'detail': 'No tenant associated.'}, status=status.HTTP_400_BAD_REQUEST)

        tenant = user.tenant

        # Farmer Self-Service Dashboard Data
        if user.role == 'FARMER':
            member = Member.objects.filter(user=user, tenant=tenant).first()
            if not member:
                return Response({'detail': 'Member profile not found.'}, status=status.HTTP_404_NOT_FOUND)

            share_acc = ShareAccount.objects.filter(member=member, tenant=tenant).first()
            savings_acc = SavingsAccount.objects.filter(member=member, tenant=tenant).first()
            loans = LoanAccount.objects.filter(member=member, tenant=tenant)
            
            total_outstanding = loans.aggregate(Sum('outstanding_principal'))['outstanding_principal__sum'] or Decimal(0)

            return Response({
                'system_role': 'FARMER',
                'member_number': member.member_number,
                'member_name': f"{member.first_name} {member.last_name}",
                'shares_amount': share_acc.total_amount if share_acc else Decimal(0),
                'savings_balance': savings_acc.current_balance if savings_acc else Decimal(0),
                'loan_outstanding': total_outstanding,
                'active_loans_count': loans.filter(loan_status='CURRENT').count()
            })

        # PKPS ERP Dashboard Metrics
        total_members = Member.objects.filter(tenant=tenant).count()
        total_outstanding = LoanAccount.objects.filter(tenant=tenant).aggregate(Sum('outstanding_principal'))['outstanding_principal__sum'] or Decimal(0)
        overdue_amount = LoanAccount.objects.filter(tenant=tenant, loan_status='OVERDUE').aggregate(Sum('outstanding_principal'))['outstanding_principal__sum'] or Decimal(0)
        total_savings = SavingsAccount.objects.filter(tenant=tenant).aggregate(Sum('current_balance'))['current_balance__sum'] or Decimal(0)
        total_shares = ShareAccount.objects.filter(tenant=tenant).aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal(0)
        pending_applications = LoanApplication.objects.filter(tenant=tenant, status='SUBMITTED').count()

        return Response({
            'system_role': 'PKPS_STAFF',
            'pkps_name': tenant.name,
            'pkps_code': tenant.code,
            'total_members': total_members,
            'loan_outstanding': total_outstanding,
            'overdue_amount': overdue_amount,
            'total_savings_deposits': total_savings,
            'total_share_capital': total_shares,
            'pending_loan_applications': pending_applications
        })
