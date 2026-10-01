from django.core.management.base import BaseCommand
from apps.tenants.models import Tenant
from apps.loans.services import seed_default_loan_products


class Command(BaseCommand):
    help = "Seeds default PKPS cooperative loan products for all existing tenants"

    def handle(self, *args, **options):
        tenants = Tenant.objects.all()
        self.stdout.write(f"Seeding loan products for {tenants.count()} tenant(s)...")
        for tenant in tenants:
            created = seed_default_loan_products(tenant)
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f"  [{tenant.name}] Created {len(created)} new loan products."
                ))
            else:
                self.stdout.write(
                    f"  [{tenant.name}] Loan products already exist — skipped."
                )
        self.stdout.write(self.style.SUCCESS("Done seeding loan products."))
