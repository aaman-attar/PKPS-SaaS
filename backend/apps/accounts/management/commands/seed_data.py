from django.core.management.base import BaseCommand
import sys
import os

class Command(BaseCommand):
    help = 'Seeds initial demonstration data and default users (admin, pkps_admin, farmer_ramesh).'

    def handle(self, *args, **options):
        # Add backend root to path
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)

        import seed_data
        seed_data.seed()
        self.stdout.write(self.style.SUCCESS('Successfully seeded PKPS database.'))
