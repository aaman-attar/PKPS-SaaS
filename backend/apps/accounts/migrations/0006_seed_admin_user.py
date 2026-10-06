from django.db import migrations
from django.contrib.auth.hashers import make_password

def seed_users(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

    # Seed or update Super Admin
    admin_user = User.objects.filter(username='admin').first()
    if not admin_user:
        admin_user = User(
            username='admin',
            email='admin@pkps.saas',
            first_name='SaaS',
            last_name='SuperAdmin',
            role='SUPER_ADMIN',
            mobile='9845403249',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
    admin_user.password = make_password('Admin@123')
    admin_user.is_active = True
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.failed_login_attempts = 0
    admin_user.locked_until = None
    if not getattr(admin_user, 'mobile', None):
        admin_user.mobile = '9845403249'
    admin_user.save()

def reverse_seed(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_otpdevice_mobile_otpdevice_purpose_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_users, reverse_seed),
    ]
