from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Member, MemberFamily, MemberLand, MemberAsset
from .serializers import MemberSerializer, CreateMemberSerializer, MemberFamilySerializer, MemberLandSerializer, MemberAssetSerializer
from apps.tenants.permissions import IsPKPSStaff, EnforceTenantIsolation

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated, EnforceTenantIsolation]

    def get_serializer_class(self):
        if self.action in ['create']:
            return CreateMemberSerializer
        return MemberSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['SUPER_ADMIN', 'SUPPORT_ADMIN']:
            return Member.objects.all()
        if user.role == 'FARMER':
            return Member.objects.filter(user=user, tenant=user.tenant)
        if user.tenant:
            qs = Member.objects.filter(tenant=user.tenant)
            search = self.request.query_params.get('search', None)
            if search:
                qs = qs.filter(
                    first_name__icontains=search
                ) | qs.filter(
                    member_number__icontains=search
                ) | qs.filter(
                    mobile__icontains=search
                )
            return qs
        return Member.objects.none()

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=['post'], url_path='add-family')
    def add_family(self, request, pk=None):
        member = self.get_object()
        serializer = MemberFamilySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=member.tenant, member=member)
        return Response(MemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='add-land')
    def add_land(self, request, pk=None):
        member = self.get_object()
        serializer = MemberLandSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=member.tenant, member=member)
        return Response(MemberSerializer(member).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='add-asset')
    def add_asset(self, request, pk=None):
        member = self.get_object()
        serializer = MemberAssetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tenant=member.tenant, member=member)
        return Response(MemberSerializer(member).data, status=status.HTTP_201_CREATED)
