from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """Allows access only to SaaS Super Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']
        )

class IsPKPSStaff(permissions.BasePermission):
    """Allows access to PKPS Staff, Officers, Accountants, Managers, Secretaries & Admins."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        staff_roles = [
            'PKPS_ADMIN', 'SECRETARY', 'MANAGER', 'ACCOUNTANT', 
            'LOAN_OFFICER', 'CASHIER', 'STAFF', 'AUDITOR', 'COMMITTEE'
        ]
        return request.user.role in staff_roles or request.user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']

class IsFarmerMember(permissions.BasePermission):
    """Allows access to individual Farmers/Members."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'FARMER'
        )

class EnforceTenantIsolation(permissions.BasePermission):
    """Strict Tenant Isolation Check."""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return True
        if hasattr(obj, 'tenant_id'):
            return str(obj.tenant_id) == str(request.user.tenant_id)
        if hasattr(obj, 'tenant'):
            return obj.tenant == request.user.tenant
        return True
