from decimal import Decimal
from .models import LoanProduct

DEFAULT_PKPS_LOAN_PRODUCTS = [
    {
        'code': 'KCC-CROP-01',
        'name': 'Short-Term Crop Loan (KCC Zero/Subsidized Scheme)',
        'interest_rate_pa': Decimal('3.00'),
        'min_amount': Decimal('5000.00'),
        'max_amount': Decimal('300000.00'),
        'tenure_months': 12,
        'description': 'Seasonal agricultural operations, seeds, fertilizers and crop cultivation inputs under subsidized KCC scheme.',
    },
    {
        'code': 'MT-AGRI-EQ-02',
        'name': 'Agricultural Machinery & Equipment Loan',
        'interest_rate_pa': Decimal('7.50'),
        'min_amount': Decimal('20000.00'),
        'max_amount': Decimal('500000.00'),
        'tenure_months': 36,
        'description': 'Medium-term credit for purchasing tractors, power tillers, sprayers, and modern micro-irrigation equipment.',
    },
    {
        'code': 'DAIRY-LIVESTOCK-03',
        'name': 'Dairy & Animal Husbandry Development Loan',
        'interest_rate_pa': Decimal('6.00'),
        'min_amount': Decimal('10000.00'),
        'max_amount': Decimal('250000.00'),
        'tenure_months': 24,
        'description': 'Livestock purchase, milch cattle, cattle sheds, and veterinary care supporting dairy farming.',
    },
    {
        'code': 'EMERGENCY-GOLD-04',
        'name': 'Emergency Agricultural Jewel / Pledge Loan',
        'interest_rate_pa': Decimal('8.50'),
        'min_amount': Decimal('5000.00'),
        'max_amount': Decimal('200000.00'),
        'tenure_months': 12,
        'description': 'Fast-track emergency liquidity for urgent farm operational expenses against agricultural pledge.',
    },
]

def seed_default_loan_products(tenant):
    """
    Ensures that standard cooperative agricultural loan products exist for the tenant society.
    """
    if not tenant:
        return []
        
    created_products = []
    for item in DEFAULT_PKPS_LOAN_PRODUCTS:
        product, created = LoanProduct.objects.get_or_create(
            tenant=tenant,
            code=item['code'],
            defaults={
                'name': item['name'],
                'interest_rate_pa': item['interest_rate_pa'],
                'min_amount': item['min_amount'],
                'max_amount': item['max_amount'],
                'tenure_months': item['tenure_months'],
                'description': item['description'],
                'is_active': True,
            }
        )
        if created:
            created_products.append(product)
            
    return created_products
