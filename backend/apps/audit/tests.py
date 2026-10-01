from django.test import TestCase
from rest_framework.test import APIClient
from apps.tenants.models import Tenant
from apps.accounts.models import User, UserRole
from apps.audit.models import AuditLog
from apps.audit.services import record_audit, compute_hash


class AuditHashChainTests(TestCase):
    """Tests for audit hash chain integrity and the verify-chain endpoint."""

    def setUp(self):
        self.tenant = Tenant.objects.create(name="Audit PACS", code="TENANT-AUDIT")
        self.manager = User.objects.create_user(
            username="manager_audit", password="Password@123",
            role=UserRole.MANAGER, tenant=self.tenant
        )
        self.client = APIClient()

    def test_audit_log_hash_chain_intact_after_records(self):
        """
        Sequential audit records must form a valid hash chain:
        each record's previous_hash = prior record's hash.
        """
        log1 = record_audit(self.manager, 'LOGIN', 'ACCOUNTS', 'User', self.manager.id)
        log2 = record_audit(self.manager, 'VIEW_MEMBER', 'MEMBERS', 'Member', 'dummy-id')

        self.assertIsNotNone(log1)
        self.assertIsNotNone(log2)

        # log2's previous_hash should point to log1's hash
        self.assertEqual(log2.previous_hash, log1.hash)

        # Verify log1's hash is correct
        expected_hash1 = compute_hash(
            log1.timestamp.isoformat(),
            str(self.manager.id),
            'LOGIN',
            str(self.manager.id),
            {},
            '0' * 64
        )
        self.assertEqual(log1.hash, expected_hash1)

    def test_verify_chain_api_returns_intact_for_valid_chain(self):
        """verify-chain endpoint must report chain_intact=True for untampered logs."""
        record_audit(self.manager, 'ACTION_1', 'TEST', 'Entity', 'id-001')
        record_audit(self.manager, 'ACTION_2', 'TEST', 'Entity', 'id-002')

        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/v1/audit/logs/verify-chain/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['chain_intact'])
        self.assertIsNone(response.data['compromised_log_id'])

    def test_verify_chain_detects_tampered_hash(self):
        """verify-chain must return chain_intact=False when a hash is tampered."""
        log1 = record_audit(self.manager, 'TAMPER_TEST', 'TEST', 'Entity', 'id-001')
        record_audit(self.manager, 'FOLLOWING_ACTION', 'TEST', 'Entity', 'id-002')

        # Tamper with log1's hash directly
        AuditLog.objects.filter(id=log1.id).update(hash='tampered_hash_value_000000000000000')

        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/v1/audit/logs/verify-chain/')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['chain_intact'])
        self.assertIsNotNone(response.data['compromised_log_id'])

    def test_audit_log_is_read_only(self):
        """AuditLogViewSet must not allow direct POST/DELETE operations."""
        self.client.force_authenticate(user=self.manager)
        post_response = self.client.post('/api/v1/audit/logs/', {
            'action': 'FAKE_AUDIT', 'module': 'TEST',
            'entity_name': 'Entity', 'entity_id': 'fake-id'
        })
        self.assertEqual(post_response.status_code, 405)

    def test_audit_logs_not_visible_cross_tenant(self):
        """Audit logs of Tenant B should not be accessible by Tenant A's user."""
        tenant_b = Tenant.objects.create(name="Other PACS", code="TENANT-AUDIT-B")
        user_b = User.objects.create_user(
            username="manager_audit_b", password="Password@123",
            role=UserRole.MANAGER, tenant=tenant_b
        )
        record_audit(user_b, 'SECRET_ACTION', 'TEST', 'Entity', 'b-001')

        # manager (tenant A) should not see tenant B's logs
        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/v1/audit/logs/')
        self.assertEqual(response.status_code, 200)
        log_actions = [log['action'] for log in response.data['results']] if 'results' in response.data else [log['action'] for log in response.data]
        self.assertNotIn('SECRET_ACTION', log_actions)


class AuditLoggingCoverageTests(TestCase):
    """Verify that key business events generate audit log entries."""

    def setUp(self):
        self.tenant = Tenant.objects.create(name="Coverage PACS", code="TENANT-COV")
        self.cashier = User.objects.create_user(
            username="cashier_cov", password="Password@123",
            role=UserRole.CASHIER, tenant=self.tenant
        )

    def test_record_audit_creates_log_entry(self):
        """record_audit must persist a log record."""
        initial_count = AuditLog.objects.count()
        record_audit(self.cashier, 'TEST_EVENT', 'TEST', 'Entity', 'test-id-001', new_values={'key': 'value'})
        self.assertEqual(AuditLog.objects.count(), initial_count + 1)
        log = AuditLog.objects.filter(action='TEST_EVENT').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.module, 'TEST')
        self.assertEqual(log.new_values, {'key': 'value'})
        self.assertEqual(log.tenant, self.tenant)

    def test_record_audit_hash_is_64_hex_chars(self):
        """Audit hash must be a 64-character hex SHA-256 string."""
        log = record_audit(self.cashier, 'HASH_TEST', 'TEST', 'Entity', 'hash-test-id')
        self.assertIsNotNone(log)
        self.assertEqual(len(log.hash), 64)
        # Must be valid hex
        int(log.hash, 16)
