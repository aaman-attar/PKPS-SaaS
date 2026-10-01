from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied

def validate_tenant_object(obj, user):
    """
    Validates that the given object belongs to the user's active tenant.
    Super Admin and Support Admin can bypass tenant checks.
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required.")
        
    if getattr(user, 'role', None) in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
        return

    obj_tenant_id = getattr(obj, 'tenant_id', None)
    if not obj_tenant_id and hasattr(obj, 'tenant') and obj.tenant:
        obj_tenant_id = obj.tenant.id

    if str(obj_tenant_id) != str(getattr(user, 'tenant_id', None)):
        raise PermissionDenied("Cross-tenant access denied.")

class IsSuperAdmin(permissions.BasePermission):
    """Allows access only to SaaS Super Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']
        )

class IsPKPSAdmin(permissions.BasePermission):
    """Allows access to PKPS Admins and Super Admins."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['PKPS_ADMIN', 'SECRETARY', 'SUPER_ADMIN', 'SUPPORT_ADMIN']
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

class IsLoanOfficer(permissions.BasePermission):
    def has_permission(self, request, view):
        allowed = ['LOAN_OFFICER', 'MANAGER', 'PKPS_ADMIN', 'SECRETARY', 'SUPER_ADMIN', 'SUPPORT_ADMIN']
        return bool(request.user and request.user.is_authenticated and request.user.role in allowed)

class IsAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        allowed = ['ACCOUNTANT', 'CASHIER', 'MANAGER', 'PKPS_ADMIN', 'SECRETARY', 'SUPER_ADMIN', 'SUPPORT_ADMIN']
        return bool(request.user and request.user.is_authenticated and request.user.role in allowed)

class IsAuditor(permissions.BasePermission):
    def has_permission(self, request, view):
        allowed = ['AUDITOR', 'PKPS_ADMIN', 'SECRETARY', 'SUPER_ADMIN', 'SUPPORT_ADMIN']
        return bool(request.user and request.user.is_authenticated and request.user.role in allowed)

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
