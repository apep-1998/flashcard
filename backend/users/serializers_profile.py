from django.contrib.auth.models import User
from rest_framework import serializers
from uploads.models import Upload
from .models import Profile


class ProfileSerializer(serializers.ModelSerializer):
    avatar_id = serializers.PrimaryKeyRelatedField(
        source="avatar",
        queryset=Upload.objects.all(),
        required=False,
        allow_null=True,
    )
    avatar_url = serializers.SerializerMethodField()
    name = serializers.CharField(source="user.first_name", required=False)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = ("name", "email", "avatar_id", "avatar_url")

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get("request")
        if request is None:
            return obj.avatar.file.url
        return request.build_absolute_uri(obj.avatar.file.url)

    def validate_avatar(self, value):
        if value and value.user_id != self.context["request"].user.id:
            raise serializers.ValidationError("Avatar must belong to the user.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)
        if user_data:
            name = user_data.get("first_name")
            if name is not None:
                instance.user.first_name = name.strip()
                instance.user.save(update_fields=["first_name"])
        return super().update(instance, validated_data)
