from rest_framework import serializers

from .models import EmailCampaign, EmailLog, EmailTemplate


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = "__all__"


class EmailCampaignSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source="template.name", read_only=True)

    class Meta:
        model = EmailCampaign
        fields = "__all__"


class EmailLogSerializer(serializers.ModelSerializer):
    template_name = serializers.ReadOnlyField(source="template.name")
    campaign_title = serializers.ReadOnlyField(source="campaign.title")

    class Meta:
        model = EmailLog
        fields = "__all__"
