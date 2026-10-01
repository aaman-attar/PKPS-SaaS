import uuid
from decimal import Decimal
from django.db import transaction
from .models import AccountHead, JournalEntry, JournalLine, AccountType

def get_or_create_account_head(tenant, code, name, account_type):
    head, _ = AccountHead.objects.get_or_create(
        tenant=tenant,
        code=code,
        defaults={'name': name, 'type': account_type}
    )
    return head

def post_journal_entry(tenant, posted_by, narration, debit_head_code, debit_head_name, debit_type, credit_head_code, credit_head_name, credit_type, amount):
    if not amount or Decimal(str(amount)) <= 0:
        return None

    amt = Decimal(str(amount))

    with transaction.atomic():
        debit_head = get_or_create_account_head(tenant, debit_head_code, debit_head_name, debit_type)
        credit_head = get_or_create_account_head(tenant, credit_head_code, credit_head_name, credit_type)

        entry_no = f"JE-{uuid.uuid4().hex[:8].upper()}"
        entry = JournalEntry.objects.create(
            tenant=tenant,
            entry_number=entry_no,
            narration=narration,
            posted_by=posted_by if posted_by and posted_by.is_authenticated else None,
            status='POSTED'
        )

        # Debit Line
        JournalLine.objects.create(
            tenant=tenant,
            journal_entry=entry,
            account_head=debit_head,
            debit=amt,
            credit=Decimal('0.00')
        )

        # Credit Line
        JournalLine.objects.create(
            tenant=tenant,
            journal_entry=entry,
            account_head=credit_head,
            debit=Decimal('0.00'),
            credit=amt
        )

        return entry

# Multi-line balanced journal posting helper
def post_multi_line_journal_entry(tenant, posted_by, narration, debit_lines, credit_lines):
    total_debit = sum([Decimal(str(d['amount'])) for d in debit_lines])
    total_credit = sum([Decimal(str(c['amount'])) for c in credit_lines])

    if total_debit != total_credit or total_debit <= 0:
        raise ValueError(f"Unbalanced journal entry: Debit ({total_debit}) != Credit ({total_credit})")

    with transaction.atomic():
        entry_no = f"JE-{uuid.uuid4().hex[:8].upper()}"
        entry = JournalEntry.objects.create(
            tenant=tenant,
            entry_number=entry_no,
            narration=narration,
            posted_by=posted_by if posted_by and posted_by.is_authenticated else None,
            status='POSTED'
        )

        for d in debit_lines:
            head = get_or_create_account_head(tenant, d['code'], d['name'], d['type'])
            JournalLine.objects.create(
                tenant=tenant, journal_entry=entry, account_head=head,
                debit=Decimal(str(d['amount'])), credit=Decimal('0.00')
            )

        for c in credit_lines:
            head = get_or_create_account_head(tenant, c['code'], c['name'], c['type'])
            JournalLine.objects.create(
                tenant=tenant, journal_entry=entry, account_head=head,
                debit=Decimal('0.00'), credit=Decimal(str(c['amount']))
            )

        return entry

# Standard PACS Transaction Accounting Hooks
def post_savings_deposit_journal(tenant, user, member, amount):
    return post_journal_entry(
        tenant=tenant,
        posted_by=user,
        narration=f"Savings Deposit from Member {member.member_number} ({member.first_name})",
        debit_head_code='1001', debit_head_name='Cash in Hand / Bank', debit_type=AccountType.ASSET,
        credit_head_code='2001', credit_head_name='Member Savings Deposits', credit_type=AccountType.LIABILITY,
        amount=amount
    )

def post_savings_withdrawal_journal(tenant, user, member, amount):
    return post_journal_entry(
        tenant=tenant,
        posted_by=user,
        narration=f"Savings Withdrawal by Member {member.member_number} ({member.first_name})",
        debit_head_code='2001', debit_head_name='Member Savings Deposits', debit_type=AccountType.LIABILITY,
        credit_head_code='1001', credit_head_name='Cash in Hand / Bank', credit_type=AccountType.ASSET,
        amount=amount
    )

def post_share_purchase_journal(tenant, user, member, amount):
    return post_journal_entry(
        tenant=tenant,
        posted_by=user,
        narration=f"Share Capital Purchase by Member {member.member_number} ({member.first_name})",
        debit_head_code='1001', debit_head_name='Cash in Hand / Bank', debit_type=AccountType.ASSET,
        credit_head_code='3001', credit_head_name='Member Share Capital', credit_type=AccountType.EQUITY,
        amount=amount
    )

def post_share_redemption_journal(tenant, user, member, amount):
    return post_journal_entry(
        tenant=tenant,
        posted_by=user,
        narration=f"Share Capital Redemption for Member {member.member_number} ({member.first_name})",
        debit_head_code='3001', debit_head_name='Member Share Capital', debit_type=AccountType.EQUITY,
        credit_head_code='1001', credit_head_name='Cash in Hand / Bank', credit_type=AccountType.ASSET,
        amount=amount
    )

def post_loan_disbursement_journal(tenant, user, member, account_number, amount):
    return post_journal_entry(
        tenant=tenant,
        posted_by=user,
        narration=f"Loan Disbursement for Account {account_number} (Member {member.member_number})",
        debit_head_code='1101', debit_head_name='Loans & Advances Outstanding', debit_type=AccountType.ASSET,
        credit_head_code='1001', credit_head_name='Cash in Hand / Bank', credit_type=AccountType.ASSET,
        amount=amount
    )

def post_loan_repayment_journal(tenant, user, member, account_number, principal_amt, interest_amt, penalty_amt=Decimal('0.00'), excess_amt=Decimal('0.00')):
    total_repayment = principal_amt + interest_amt + penalty_amt + excess_amt
    if total_repayment <= 0:
        return None

    debit_lines = [
        {'code': '1001', 'name': 'Cash in Hand / Bank', 'type': AccountType.ASSET, 'amount': total_repayment}
    ]
    credit_lines = []

    if principal_amt > 0:
        credit_lines.append({'code': '1101', 'name': 'Loans & Advances Outstanding', 'type': AccountType.ASSET, 'amount': principal_amt})
    if interest_amt > 0:
        credit_lines.append({'code': '4001', 'name': 'Loan Interest Income', 'type': AccountType.INCOME, 'amount': interest_amt})
    if penalty_amt > 0:
        credit_lines.append({'code': '4002', 'name': 'Loan Penalty Charges Income', 'type': AccountType.INCOME, 'amount': penalty_amt})
    if excess_amt > 0:
        credit_lines.append({'code': '2002', 'name': 'Member Excess Credit / Advance Repayment', 'type': AccountType.LIABILITY, 'amount': excess_amt})

    return post_multi_line_journal_entry(
        tenant=tenant,
        posted_by=user,
        narration=f"Loan Repayment for Account {account_number} (Member {member.member_number})",
        debit_lines=debit_lines,
        credit_lines=credit_lines
    )
