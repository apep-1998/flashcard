from django.contrib import admin
from .models import Upload


@admin.register(Upload)
class UploadAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "original_name", "content_type", "size", "created_at")
    search_fields = ("original_name", "user__email")
    list_filter = ("content_type", "created_at")

# Register your models here.
