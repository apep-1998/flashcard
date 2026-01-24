from django.conf import settings
from django.db import models
from django.utils import timezone


class Box(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="boxes"
    )
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    share_code = models.CharField(max_length=64, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"], name="unique_box_name_per_user"
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.user_id})"

    @property
    def total_cards(self):
        return self.cards.count()

    @property
    def finished_cards(self):
        return self.cards.filter(finished=True).count()

    @property
    def ready_cards(self):
        return self.cards.filter(
            finished=False, next_review_time__lte=timezone.now()
        ).count()

    @property
    def active_cards(self):
        return self.cards.filter(finished=False).exclude(level=0).count()


class Card(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cards"
    )
    box = models.ForeignKey(Box, on_delete=models.CASCADE, related_name="cards")
    finished = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    level = models.PositiveIntegerField(default=0)
    group_id = models.CharField(max_length=120, blank=True)
    next_review_time = models.DateTimeField(null=True, blank=True)
    config = models.JSONField(default=dict)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["box", "created_at"]),
            models.Index(fields=["box", "finished"]),
            models.Index(fields=["box", "next_review_time"]),
        ]

    def __str__(self):
        return f"Card {self.id} ({self.box_id})"


class CardActivity(models.Model):
    class Action(models.TextChoices):
        CREATE = "create", "Create"
        ACTIVATE = "activate", "Activate"
        ANSWER_CORRECT = "answer_correct", "Answer correct"
        ANSWER_INCORRECT = "answer_incorrect", "Answer incorrect"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="card_activities",
    )
    card = models.ForeignKey(
        Card, on_delete=models.CASCADE, related_name="activities"
    )
    action = models.CharField(max_length=32, choices=Action.choices)
    card_level = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["card", "created_at"]),
            models.Index(fields=["action", "created_at"]),
        ]

    def __str__(self):
        return f"{self.action} (card {self.card_id})"


class CardAuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "create", "Create"
        UPDATE = "update", "Update"
        DELETE = "delete", "Delete"
        REVIEW = "review", "Review"
        ACTIVATE = "activate", "Activate"
        BULK_DELETE = "bulk_delete", "Bulk delete"
        BULK_CREATE = "bulk_create", "Bulk create"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="card_audit_logs",
    )
    card = models.ForeignKey(
        Card,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=32, choices=Action.choices)
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["card", "created_at"]),
            models.Index(fields=["action", "created_at"]),
        ]

    def __str__(self):
        return f"{self.action} (card {self.card_id})"


class AiReviewLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_review_logs",
    )
    card = models.ForeignKey(
        Card, on_delete=models.CASCADE, related_name="ai_review_logs"
    )
    card_level = models.PositiveIntegerField()
    answer = models.TextField()
    review = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["card", "created_at"]),
        ]

    def __str__(self):
        return f"AI review {self.id} (card {self.card_id})"


class Exercise(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exercises",
    )
    title = models.CharField(max_length=200)
    question_making_prompt = models.TextField()
    evaluate_prompt = models.TextField()
    exercises = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["user", "title"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.user_id})"


class ExerciseHistory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exercise_histories",
    )
    exercise = models.ForeignKey(
        Exercise, on_delete=models.CASCADE, related_name="history"
    )
    question = models.TextField()
    answer = models.TextField()
    review = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["exercise", "created_at"]),
        ]

    def __str__(self):
        return f"Exercise history {self.id} ({self.exercise_id})"
