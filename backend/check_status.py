import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.loans.models import LoanProduct
from apps.tenants.models import Tenant
from apps.accounts.models import User
from apps.members.models import Member

print('Tenants count:', Tenant.objects.count())
for t in Tenant.objects.all():
    print(f'Tenant: {t.id} - {t.name} (Code: {t.code})')

print('Users:')
for u in User.objects.all():
    print(f'User: {u.username}, role: {u.role}, tenant: {u.tenant}')

print('LoanProducts count:', LoanProduct.objects.count())
for lp in LoanProduct.objects.all():
    print(f'LoanProduct: {lp.id} - {lp.name}, tenant: {lp.tenant}, max: {lp.max_amount}')

print('Members count:', Member.objects.count())
for m in Member.objects.all():
    print(f'Member: {m.id} - {m.member_number} - {m.first_name} {m.last_name}, tenant: {m.tenant}, user: {m.user}')
