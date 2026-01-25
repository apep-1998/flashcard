from django.contrib import admin
from .models import (
    Box,
    Card,
    CardActivity,
    CardAuditLog,
    AiReviewLog,
    Exercise,
    ExerciseHistory,
)


@admin.register(Box)
class BoxAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "user",
        "share_code",
        "total_cards",
        "finished_cards",
        "ready_cards",
    )
    search_fields = ("name", "user__email")
    list_filter = ("created_at",)


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ("id", "box", "user", "finished", "level", "group_id")
    search_fields = ("box__name", "group_id", "user__email")
    list_filter = ("finished", "level", "is_important")

@admin.register(CardActivity)
class CardActivityAdmin(admin.ModelAdmin):
    list_display = ("id", "card", "user", "action", "card_level", "created_at")
    search_fields = ("card__id", "user__email", "action")
    list_filter = ("action", "created_at")


@admin.register(CardAuditLog)
class CardAuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "card", "user", "action", "created_at")
    search_fields = ("card__id", "user__email", "action")
    list_filter = ("action", "created_at")


@admin.register(AiReviewLog)
class AiReviewLogAdmin(admin.ModelAdmin):
    list_display = ("id", "card", "user", "card_level", "created_at")
    search_fields = ("card__id", "user__email")
    list_filter = ("created_at",)


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "created_at")
    search_fields = ("title", "user__email")
    list_filter = ("created_at",)


@admin.register(ExerciseHistory)
class ExerciseHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "exercise", "user", "created_at")
    search_fields = ("exercise__title", "user__email")
    list_filter = ("created_at",)
