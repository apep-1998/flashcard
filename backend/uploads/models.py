import os
import uuid
from django.conf import settings
from django.db import models


def upload_to(instance, filename):
    ext = os.path.splitext(filename)[1]
    return f"uploads/{instance.user_id}/{uuid.uuid4().hex}{ext}"


class Upload(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="uploads"
    )
    file = models.FileField(upload_to=upload_to)
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.original_name} ({self.user_id})"
