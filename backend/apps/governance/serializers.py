from rest_framework import serializers
from .models import CommitteeMeeting

class CommitteeMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommitteeMeeting
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at')
