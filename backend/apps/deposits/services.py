from decimal import Decimal
from apps.deposits.models import SavingsAccount
from apps.shares.models import ShareAccount

def ensure_member_financial_accounts(member):
    """
    Ensures an active cooperative member has:
    1. A Thrift Savings Account with account number SB-<tenant-suffix>-<member_num>
    2. A Share Capital Account with initial allotted shares
    """
    if not member or not member.tenant:
        return None, None

    savings_acc = SavingsAccount.objects.filter(member=member).first()
    if not savings_acc:
        tenant_suffix = member.tenant.code.split('-')[-1] if member.tenant.code else '001'
        member_clean = member.member_number.replace('-', '')
        acc_no = f"SB-{tenant_suffix}-{member_clean}"
        savings_acc, _ = SavingsAccount.objects.get_or_create(
            tenant=member.tenant,
            member=member,
            defaults={
                'account_number': acc_no,
                'current_balance': Decimal('2500.00'),
                'interest_rate_pa': Decimal('4.00'),
                'status': 'ACTIVE',
            }
        )

    share_acc = ShareAccount.objects.filter(member=member).first()
    if not share_acc:
        share_acc, _ = ShareAccount.objects.get_or_create(
            tenant=member.tenant,
            member=member,
            defaults={
                'total_shares': 10,
                'share_unit_price': Decimal('100.00'),
                'total_amount': Decimal('1000.00'),
            }
        )

    return savings_acc, share_acc
