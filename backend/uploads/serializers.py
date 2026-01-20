from rest_framework import serializers
from .models import Upload


class UploadSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Upload
        fields = ("id", "url", "original_name", "content_type", "size", "created_at")

    def get_url(self, obj):
        request = self.context.get("request")
        if request is None:
            return obj.file.url
        return request.build_absolute_uri(obj.file.url)


class UploadCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = Upload
        fields = ("file",)

    def create(self, validated_data):
        file = validated_data["file"]
        return Upload.objects.create(
            user=self.context["request"].user,
            file=file,
            original_name=file.name,
            content_type=getattr(file, "content_type", ""),
            size=getattr(file, "size", 0),
        )
