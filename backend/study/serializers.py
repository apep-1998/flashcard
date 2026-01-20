from rest_framework import serializers
from .models import Box, Card


class BoxSerializer(serializers.ModelSerializer):
    total_cards = serializers.IntegerField(read_only=True)
    finished_cards = serializers.IntegerField(read_only=True)
    ready_cards = serializers.IntegerField(read_only=True)
    active_cards = serializers.IntegerField(read_only=True)

    class Meta:
        model = Box
        fields = (
            "id",
            "name",
            "description",
            "total_cards",
            "finished_cards",
            "ready_cards",
            "active_cards",
            "share_code",
            "created_at",
            "updated_at",
        )


class CardSerializer(serializers.ModelSerializer):
    box_id = serializers.PrimaryKeyRelatedField(
        source="box", queryset=Box.objects.all(), write_only=True
    )
    box = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Card
        fields = (
            "id",
            "box",
            "box_id",
            "finished",
            "level",
            "group_id",
            "next_review_time",
            "config",
            "created_at",
            "updated_at",
        )
