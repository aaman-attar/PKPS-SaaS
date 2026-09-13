import os
import sys
import django

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from apps.tenants.models import Tenant, TenantStatus
from apps.accounts.models import User, UserRole
from apps.members.models import Member, MemberLand
from apps.shares.models import ShareAccount, ShareTransaction
from apps.loans.models import LoanProduct, LoanApplication, LoanAccount, LoanApplicationStatus, LoanAccountStatus
from apps.deposits.models import SavingsAccount
from apps.accounting.models import AccountHead, AccountType

def seed():
    print("🌱 Seeding PKPS SaaS initial data...")

    # 1. SaaS Super Admin
    super_admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@pkps.saas',
            'first_name': 'SaaS',
            'last_name': 'SuperAdmin',
            'role': UserRole.SUPER_ADMIN,
            'mobile': '9845403249',
            'is_staff': True,
            'is_superuser': True
        }
    )
    super_admin.set_password('Admin@123')
    if not super_admin.mobile:
        super_admin.mobile = '9845403249'
    super_admin.save()
    print("  ✓ Configured Super Admin user: admin / Admin@123")

    # 2. PKPS Tenant
    tenant, created = Tenant.objects.get_or_create(
        code='PKPS-MANDYA-001',
        defaults={
            'name': 'Mandya Primary Agricultural Credit Society',
            'registration_number': 'MND/PACS/2026/045',
            'village': 'Mandya Rural',
            'taluk': 'Mandya',
            'district': 'Mandya',
            'state': 'Karnataka',
            'pincode': '571401',
            'dccb_name': 'Mandya District Central Cooperative Bank',
            'contact_number': '+919876543210',
            'email': 'contact@mandyapkps.org',
            'status': TenantStatus.ACTIVE,
            'subscription_plan': 'PREMIUM'
        }
    )
    print(f"  ✓ PKPS Tenant active: {tenant.name}")

    # 3. PKPS Admin User
    pkps_admin, created = User.objects.get_or_create(
        username='pkps_admin',
        defaults={
            'email': 'admin@mandyapkps.org',
            'first_name': 'Suresh',
            'last_name': 'Gowda',
            'role': UserRole.PKPS_ADMIN,
            'tenant': tenant,
            'mobile': '9876543211'
        }
    )
    pkps_admin.set_password('PkpsAdmin@123')
    pkps_admin.save()
    print("  ✓ Configured PKPS Admin: pkps_admin / PkpsAdmin@123")

    # 4. Loan Officer Staff
    loan_officer, created = User.objects.get_or_create(
        username='loan_officer',
        defaults={
            'email': 'officer@mandyapkps.org',
            'first_name': 'Anand',
            'last_name': 'Kumar',
            'role': UserRole.LOAN_OFFICER,
            'tenant': tenant,
            'mobile': '9876543212'
        }
    )
    loan_officer.set_password('Staff@123')
    loan_officer.save()
    print("  ✓ Configured Loan Officer: loan_officer / Staff@123")

    # 5. Farmer User & Member Profile
    farmer_user, created = User.objects.get_or_create(
        username='farmer_ramesh',
        defaults={
            'email': 'ramesh@farmer.org',
            'first_name': 'Ramesh',
            'last_name': 'Patil',
            'role': UserRole.FARMER,
            'tenant': tenant,
            'mobile': '9876543213'
        }
    )
    farmer_user.set_password('Farmer@123')
    farmer_user.save()
    print("  ✓ Configured Farmer User: farmer_ramesh / Farmer@123")


    member, created = Member.objects.get_or_create(
        tenant=tenant,
        member_number='M-000125',
        defaults={
            'user': farmer_user,
            'first_name': 'Ramesh',
            'last_name': 'Patil',
            'gender': 'MALE',
            'mobile': '9876543213',
            'email': 'ramesh@farmer.org',
            'village': 'Mandya Rural',
            'taluk': 'Mandya',
            'district': 'Mandya',
            'pincode': '571401',
            'status': 'ACTIVE'
        }
    )
    if created:
        MemberLand.objects.create(
            tenant=tenant,
            member=member,
            survey_number='SY-142/3A',
            area_acres=Decimal('3.50'),
            village='Mandya Rural',
            ownership_type='Self Owned'
        )
        print("  ✓ Created Member Profile & Land record (3.5 acres) for Ramesh")

    # 6. Share Account & Savings Account
    share_acc, created = ShareAccount.objects.get_or_create(
        tenant=tenant,
        member=member,
        defaults={
            'total_shares': 50,
            'share_unit_price': Decimal('100.00'),
            'total_amount': Decimal('5000.00')
        }
    )
    
    savings_acc, created = SavingsAccount.objects.get_or_create(
        tenant=tenant,
        member=member,
        defaults={
            'account_number': 'SB-000125',
            'current_balance': Decimal('12500.00')
        }
    )
    print("  ✓ Initialized Shares (₹5,000) & Savings (₹12,500) for Ramesh")

    # 7. Loan Product
    loan_prod, created = LoanProduct.objects.get_or_create(
        tenant=tenant,
        code='CROP-KHARIF-01',
        defaults={
            'name': 'Kharif Agricultural Crop Loan',
            'interest_rate_pa': Decimal('7.00'),
            'min_amount': Decimal('10000.00'),
            'max_amount': Decimal('300000.00'),
            'tenure_months': 12,
            'description': 'Short-term credit for seasonal agricultural operations'
        }
    )
    print(f"  ✓ Loan Product active: {loan_prod.name} (7.00%)")

    # 8. Sample Active Loan
    loan_app, created = LoanApplication.objects.get_or_create(
        tenant=tenant,
        application_number='LA-2026-0001',
        defaults={
            'member': member,
            'loan_product': loan_prod,
            'requested_amount': Decimal('100000.00'),
            'approved_amount': Decimal('100000.00'),
            'purpose': 'Paddy cultivation inputs & seed purchase',
            'status': LoanApplicationStatus.DISBURSED,
            'verified_by': loan_officer,
            'approved_by': pkps_admin
        }
    )

    if created:
        LoanAccount.objects.create(
            tenant=tenant,
            member=member,
            application=loan_app,
            account_number='LN-000234',
            sanctioned_amount=Decimal('100000.00'),
            disbursed_amount=Decimal('100000.00'),
            interest_rate_pa=Decimal('7.00'),
            outstanding_principal=Decimal('42000.00'),
            outstanding_interest=Decimal('1470.00'),
            loan_status=LoanAccountStatus.CURRENT
        )
        print("  ✓ Active Loan Created: LN-000234 (Disbursed: ₹1,00,000, Outstanding: ₹42,000)")

    # 9. Chart of Accounts
    chart_of_accounts = [
        ('1001', 'Cash in Hand', AccountType.ASSET),
        ('1002', 'DCCB Bank Account', AccountType.ASSET),
        ('1101', 'Crop Loans Outstanding', AccountType.ASSET),
        ('2001', 'Member Savings Deposits', AccountType.LIABILITY),
        ('3001', 'Member Share Capital', AccountType.EQUITY),
        ('4001', 'Loan Interest Income', AccountType.INCOME),
        ('5001', 'Administrative Expense', AccountType.EXPENSE),
    ]
    for code, name, acct_type in chart_of_accounts:
        AccountHead.objects.get_or_create(
            tenant=tenant,
            code=code,
            defaults={'name': name, 'type': acct_type}
        )
    print("  ✓ Chart of Accounts initialized for PKPS")

    print("🎉 Seeding complete!")

if __name__ == '__main__':
    seed()
