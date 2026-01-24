from base64 import b64encode
from datetime import date, timedelta
from uuid import uuid4

from django.db.models import Count, Q
from django.db.models.functions import TruncDay, TruncMonth, TruncWeek
from django.urls import reverse_lazy
from django.utils import timezone
from google import genai
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .ai_models import (
    ExerciseItems,
    ExerciseReview,
    Review,
    prompt_ai_review,
    prompt_exercise_questions,
)
from .models import (
    AiReviewLog,
    Box,
    Card,
    CardActivity,
    CardAuditLog,
    Exercise,
    ExerciseHistory,
)
from .serializers import (
    BoxSerializer,
    CardSerializer,
    ExerciseSerializer,
    ExerciseHistorySerializer,
)


class BoxViewSet(viewsets.ModelViewSet):
    serializer_class = BoxSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Box.objects.filter(user=self.request.user).order_by("-created_at")
        ready_only = self.request.query_params.get("ready_only")
        if ready_only == "1":
            queryset = queryset.filter(
                cards__finished=False, cards__next_review_time__lte=timezone.now()
            ).distinct()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"], url_path="activate-cards")
    def activate_cards(self, request, pk=None):
        box = self.get_object()
        raw_count = request.data.get("count")
        try:
            count = int(raw_count)
        except (TypeError, ValueError):
            raise ValidationError({"count": "A valid number is required."})
        if count <= 0:
            raise ValidationError({"count": "Count must be greater than zero."})

        cards = (
            Card.objects.filter(
                box=box,
                user=request.user,
                level=0,
                next_review_time__isnull=True,
            )
            .order_by("created_at")
            .only("id", "group_id", "created_at", "level")
        )

        groups = []
        seen = set()
        for card in cards:
            group_key = card.group_id.strip() if card.group_id else f"id:{card.id}"
            if group_key in seen:
                continue
            seen.add(group_key)
            groups.append(group_key)
            if len(groups) >= count:
                break

        if not groups:
            return Response({"activated": 0, "groups": []})

        group_ids = [g for g in groups if not g.startswith("id:")]
        id_groups = [int(g.split("id:")[1]) for g in groups if g.startswith("id:")]

        now = timezone.now()
        updated = 0
        cards_to_activate = []
        if group_ids:
            queryset = Card.objects.filter(
                box=box,
                user=request.user,
                level=0,
                next_review_time__isnull=True,
                group_id__in=group_ids,
            )
            cards_to_activate.extend(list(queryset))
            updated += queryset.update(level=1, next_review_time=now)

        if id_groups:
            queryset = Card.objects.filter(
                box=box,
                user=request.user,
                level=0,
                next_review_time__isnull=True,
                id__in=id_groups,
            )
            cards_to_activate.extend(list(queryset))
            updated += queryset.update(level=1, next_review_time=now)

        if cards_to_activate:
            CardActivity.objects.bulk_create(
                [
                    CardActivity(
                        user=request.user,
                        card=card,
                        action=CardActivity.Action.ACTIVATE,
                        card_level=card.level,
                    )
                    for card in cards_to_activate
                ]
            )
            CardAuditLog.objects.bulk_create(
                [
                    CardAuditLog(
                        user=request.user,
                        card=card,
                        action=CardAuditLog.Action.ACTIVATE,
                        before_data=_card_snapshot(card),
                        after_data={
                            **_card_snapshot(card),
                            "level": 1,
                            "next_review_time": now.isoformat(),
                        },
                    )
                    for card in cards_to_activate
                ]
            )

        return Response({"activated": updated, "groups": groups})

    @action(detail=True, methods=["post"], url_path="delete-cards")
    def delete_cards(self, request, pk=None):
        box = self.get_object()
        cards = list(Card.objects.filter(box=box, user=request.user))
        if cards:
            CardAuditLog.objects.bulk_create(
                [
                    CardAuditLog(
                        user=request.user,
                        card=card,
                        action=CardAuditLog.Action.BULK_DELETE,
                        before_data=_card_snapshot(card),
                        after_data=None,
                        metadata={"source": "delete_cards"},
                    )
                    for card in cards
                ]
            )
        deleted, _ = Card.objects.filter(box=box, user=request.user).delete()
        return Response({"deleted": deleted})

    @action(detail=True, methods=["post"], url_path="share")
    def share(self, request, pk=None):
        box = self.get_object()
        if not box.share_code:
            box.share_code = uuid4().hex
            box.save(update_fields=["share_code", "updated_at"])
        return Response({"share_code": box.share_code})

    @action(detail=False, methods=["post"], url_path="clone")
    def clone(self, request):
        code = request.data.get("code", "").strip()
        if not code:
            raise ValidationError({"code": "Share code is required."})
        try:
            source = Box.objects.get(share_code=code)
        except Box.DoesNotExist:
            raise ValidationError({"code": "Share code not found."})

        new_box = Box.objects.create(
            user=request.user,
            name=f"{source.name} (copy)",
            description=source.description,
        )

        cards = Card.objects.filter(box=source).order_by("created_at")
        new_cards = [
            Card(
                user=request.user,
                box=new_box,
                finished=False,
                level=0,
                group_id=card.group_id,
                next_review_time=None,
                config=card.config,
            )
            for card in cards
        ]
        if new_cards:
            Card.objects.bulk_create(new_cards)
        return Response({"box_id": new_box.id})


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _split_list_param(self, value):
        if not value:
            return []
        return [item.strip() for item in value.split(",") if item.strip()]

    def _tts_voice_name(self, language: str | None):
        lang = (language or "en").strip().lower()
        if lang in {"de", "de-de", "german"}:
            return "Klaus22k_nt"
        return "Ryan22k_NT"

    def _tts_url(self, text: str, language: str | None):
        encoded = b64encode(text.encode("utf-8")).decode("ascii")
        voice = self._tts_voice_name(language)
        return (
            "https://voice.reverso.net/RestPronunciation.svc/v1/output=json/"
            f"GetVoiceStream/voiceName={voice}?inputText={encoded}"
        )

    def _apply_tts(self, config: dict):
        card_type = config.get("type")
        if card_type in {"spelling", "word-standard", "multiple-choice"}:
            text = config.get("text_to_speech")
            if text and not config.get("voice_file_url"):
                config["voice_file_url"] = self._tts_url(
                    text, config.get("text_to_speech_language")
                )
        if card_type == "standard":
            front_text = config.get("front_text_to_speech")
            if front_text and not config.get("front_voice_file_url"):
                config["front_voice_file_url"] = self._tts_url(
                    front_text, config.get("front_text_to_speech_language")
                )
            back_text = config.get("back_text_to_speech")
            if back_text and not config.get("back_voice_file_url"):
                config["back_voice_file_url"] = self._tts_url(
                    back_text, config.get("back_text_to_speech_language")
                )
        return config

    def get_queryset(self):
        queryset = Card.objects.filter(user=self.request.user).order_by("-created_at")
        params = self.request.query_params

        box_id = params.get("box")
        if box_id:
            try:
                queryset = queryset.filter(box_id=int(box_id))
            except (TypeError, ValueError):
                pass

        card_type = params.get("type")
        if card_type:
            types = self._split_list_param(card_type)
            if len(types) > 1:
                queryset = queryset.filter(config__type__in=types)
            elif types:
                queryset = queryset.filter(config__type=types[0])

        level = params.get("level")
        if level:
            levels = []
            for value in self._split_list_param(level):
                try:
                    levels.append(int(value))
                except (TypeError, ValueError):
                    continue
            if len(levels) > 1:
                queryset = queryset.filter(level__in=levels)
            elif levels:
                queryset = queryset.filter(level=levels[0])

        group_id = params.get("group_id")
        if group_id:
            queryset = queryset.filter(group_id__icontains=group_id)

        ready = params.get("ready")
        if ready == "1":
            queryset = queryset.filter(
                finished=False, next_review_time__lte=timezone.now()
            )

        order = params.get("order")
        if order == "next_review_time":
            queryset = queryset.order_by("next_review_time", "created_at")

        return queryset

    def destroy(self, request, *args, **kwargs):
        card = self.get_object()
        CardAuditLog.objects.create(
            user=request.user,
            card=card,
            action=CardAuditLog.Action.DELETE,
            before_data=_card_snapshot(card),
            after_data=None,
        )
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        box = serializer.validated_data["box"]
        if box.user_id != self.request.user.id:
            raise ValidationError("Box does not belong to the user.")
        config = serializer.validated_data.get("config", {})
        config = self._apply_tts(config)
        card = serializer.save(user=self.request.user, config=config)
        CardActivity.objects.create(
            user=self.request.user,
            card=card,
            action=CardActivity.Action.CREATE,
            card_level=card.level,
        )
        CardAuditLog.objects.create(
            user=self.request.user,
            card=card,
            action=CardAuditLog.Action.CREATE,
            before_data=None,
            after_data=_card_snapshot(card),
        )

    def perform_update(self, serializer):
        before = _card_snapshot(serializer.instance)
        config = serializer.validated_data.get("config")
        if config is not None:
            config = self._apply_tts(config)
            serializer.save(config=config)
        else:
            serializer.save()
        CardAuditLog.objects.create(
            user=self.request.user,
            card=serializer.instance,
            action=CardAuditLog.Action.UPDATE,
            before_data=before,
            after_data=_card_snapshot(serializer.instance),
        )

    @action(detail=False, methods=["post"], url_path="bulk-create")
    def bulk_create(self, request):
        box_id = request.data.get("box_id")
        cards = request.data.get("cards", [])
        group_id = request.data.get("group_id", "")

        if not box_id:
            raise ValidationError({"box_id": "Box id is required."})
        if not isinstance(cards, list) or not cards:
            raise ValidationError({"cards": "A non-empty list of cards is required."})

        try:
            box = Box.objects.get(id=box_id, user=request.user)
        except Box.DoesNotExist:
            raise ValidationError({"box_id": "Box does not belong to the user."})

        errors = []
        new_cards = []
        for index, payload in enumerate(cards):
            if not isinstance(payload, dict):
                errors.append({"index": index, "error": "Card must be an object."})
                continue

            config = payload.get("config")
            if config is None:
                config = dict(payload)
                payload_group = config.pop("group_id", "")
            else:
                payload_group = payload.get("group_id", "")

            resolved_group = payload_group or group_id or ""

            if not isinstance(config, dict):
                errors.append({"index": index, "error": "Config must be an object."})
                continue
            if not config.get("type"):
                errors.append({"index": index, "error": "Card type is required."})
                continue

            config = self._apply_tts(config)
            new_cards.append(
                Card(
                    user=request.user,
                    box=box,
                    finished=False,
                    level=0,
                    group_id=resolved_group,
                    next_review_time=None,
                    config=config,
                )
            )

        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        created_cards = Card.objects.bulk_create(new_cards)
        CardActivity.objects.bulk_create(
            [
                CardActivity(
                    user=request.user,
                    card=card,
                    action=CardActivity.Action.CREATE,
                    card_level=card.level,
                )
                for card in created_cards
            ]
        )
        CardAuditLog.objects.bulk_create(
            [
                CardAuditLog(
                    user=request.user,
                    card=card,
                    action=CardAuditLog.Action.BULK_CREATE,
                    before_data=None,
                    after_data=_card_snapshot(card),
                )
                for card in created_cards
            ]
        )

        return Response(
            {"created": len(created_cards), "ids": [card.id for card in created_cards]},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        card = self.get_object()
        correct = request.data.get("correct")
        if correct is None:
            raise ValidationError({"correct": "This field is required."})

        if isinstance(correct, str):
            is_correct = correct.strip().lower() in {"1", "true", "yes"}
        else:
            is_correct = bool(correct)

        before_snapshot = _card_snapshot(card)
        previous_level = card.level
        now = timezone.now()
        if is_correct:
            card.level = card.level + 1
            if card.level > 7:
                card.level = 8
                card.finished = True
                card.next_review_time = None
            else:
                schedule_hours = {
                    1: 0,
                    2: 12,
                    3: 24,
                    4: 48,
                    5: 96,
                    6: 168,
                    7: 336,
                }
                hours = schedule_hours.get(card.level, 0)
                card.next_review_time = now + timedelta(hours=hours)
        else:
            card.level = 1
            card.finished = False
            card.next_review_time = now

        card.save(update_fields=["level", "finished", "next_review_time", "updated_at"])
        CardActivity.objects.create(
            user=request.user,
            card=card,
            action=(
                CardActivity.Action.ANSWER_CORRECT
                if is_correct
                else CardActivity.Action.ANSWER_INCORRECT
            ),
            card_level=previous_level,
        )
        CardAuditLog.objects.create(
            user=request.user,
            card=card,
            action=CardAuditLog.Action.REVIEW,
            before_data=before_snapshot,
            after_data=_card_snapshot(card),
        )
        serializer = self.get_serializer(card)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="ai-review")
    def ai_review(self, request, pk=None):
        card = self.get_object()
        answer: str = request.data.get("answer", "")
        if not isinstance(answer, str) or not answer.strip():
            raise ValidationError({"answer": "Answer text is required."})

        # TODO: Replace this stub with real AI evaluation logic.
        client = genai.Client()
        prompt = f"""
        {prompt_ai_review}

        ==================
        task details:
        {card.config["validate_answer_promt"]}

        ==================
        user input:
        {answer}
        """
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": Review.model_json_schema(),
            },
        )

        review = Review.model_validate_json(response.text)
        review_data = review.model_dump()
        AiReviewLog.objects.create(
            user=request.user,
            card=card,
            card_level=card.level,
            answer=answer,
            review=review_data,
        )

        return Response(review_data)

    @action(detail=False, methods=["get"], url_path="ready-summary")
    def ready_summary(self, request):
        params = request.query_params
        queryset = Card.objects.filter(user=request.user)

        box_id = params.get("box")
        if box_id:
            try:
                queryset = queryset.filter(box_id=int(box_id))
            except (TypeError, ValueError):
                pass

        queryset = queryset.filter(finished=False, next_review_time__lte=timezone.now())

        card_type = params.get("type")
        if card_type:
            types = self._split_list_param(card_type)
            if len(types) > 1:
                queryset = queryset.filter(config__type__in=types)
            elif types:
                queryset = queryset.filter(config__type=types[0])

        level = params.get("level")
        if level:
            levels = []
            for value in self._split_list_param(level):
                try:
                    levels.append(int(value))
                except (TypeError, ValueError):
                    continue
            if len(levels) > 1:
                queryset = queryset.filter(level__in=levels)
            elif levels:
                queryset = queryset.filter(level=levels[0])

        levels = list(queryset.order_by().values_list("level", flat=True).distinct())
        types = list(
            queryset.order_by().values_list("config__type", flat=True).distinct()
        )
        return Response({"count": queryset.count(), "levels": levels, "types": types})


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Exercise.objects.filter(user=self.request.user).order_by(
            "-created_at"
        )
        queryset = queryset.annotate(
            history_count=Count("history", distinct=True),
            success_count=Count(
                "history", filter=Q(history__score__gte=7), distinct=True
            ),
        )
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(title__icontains=search)
        return queryset

    def perform_create(self, serializer):
        exercise = serializer.save(user=self.request.user)
        if not exercise.exercises:
            self._generate_exercises(exercise)

    def perform_update(self, serializer):
        previous_prompt = serializer.instance.question_making_prompt
        exercise = serializer.save()
        if exercise.question_making_prompt != previous_prompt:
            self._generate_exercises(exercise)
            return
        if not exercise.exercises:
            self._generate_exercises(exercise)

    def _generate_exercises(self, exercise: Exercise):
        client = genai.Client()
        prompt = f"""
        {prompt_exercise_questions}

        ==================
        exercise prompt:
        {exercise.question_making_prompt}

        ==================
        instructions:
        Generate 10 exercises for the topic that I give you.
        """
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": ExerciseItems.model_json_schema(),
            },
        )
        exercises = ExerciseItems.model_validate_json(response.text)
        exercise.exercises = exercises.exercises
        exercise.save(update_fields=["exercises", "updated_at"])

    @action(detail=False, methods=["post"], url_path="bulk-create")
    def bulk_create(self, request):
        data = request.data
        if not isinstance(data, list):
            raise ValidationError({"detail": "Expected a list of exercises."})

        errors = []
        exercises = []
        for index, entry in enumerate(data):
            if not isinstance(entry, dict):
                errors.append({"index": index, "error": "Exercise must be an object."})
                continue
            title = str(entry.get("title", "")).strip()
            question_prompt = str(entry.get("question_making_prompt", "")).strip()
            evaluate_prompt = str(entry.get("evaluate_prompt", "")).strip()
            if not title:
                errors.append({"index": index, "error": "Title is required."})
                continue
            if not question_prompt:
                errors.append(
                    {
                        "index": index,
                        "error": "question_making_prompt is required.",
                    }
                )
                continue
            if not evaluate_prompt:
                errors.append(
                    {
                        "index": index,
                        "error": "evaluate_prompt is required.",
                    }
                )
                continue
            exercises.append(
                Exercise(
                    user=request.user,
                    title=title,
                    question_making_prompt=question_prompt,
                    evaluate_prompt=evaluate_prompt,
                    exercises=list(entry.get("exercises", []))
                    if isinstance(entry.get("exercises"), list)
                    else [],
                )
            )

        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        created = Exercise.objects.bulk_create(exercises)
        for exercise in created:
            if not exercise.exercises:
                self._generate_exercises(exercise)
        serializer = ExerciseSerializer(created, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="evaluate")
    def evaluate(self, request, pk=None):
        exercise = self.get_object()
        question: str = request.data.get("question", "")
        answer: str = request.data.get("answer", "")

        if not isinstance(question, str) or not question.strip():
            raise ValidationError({"question": "Question is required."})
        if not isinstance(answer, str) or not answer.strip():
            raise ValidationError({"answer": "Answer is required."})

        client = genai.Client()
        prompt = f"""
        evaluation prompt:
        {exercise.evaluate_prompt}

        ==================
        question:
        {question}

        ==================
        user input:
        {answer}
        """
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": ExerciseReview.model_json_schema(),
            },
        )
        review = ExerciseReview.model_validate_json(response.text)
        review_data = review.model_dump()

        ExerciseHistory.objects.create(
            user=request.user,
            exercise=exercise,
            question=question,
            answer=answer,
            review=review_data,
            score=review_data.get("score", 0),
        )

        return Response(review_data)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        exercise = self.get_object()
        question: str = request.data.get("question", "")
        if not isinstance(question, str) or not question.strip():
            raise ValidationError({"question": "Question is required."})

        exercises = list(exercise.exercises or [])
        try:
            exercises.remove(question)
        except ValueError:
            raise ValidationError({"question": "Question not found in exercise."})

        exercise.exercises = exercises
        exercise.save(update_fields=["exercises", "updated_at"])

        if not exercise.exercises:
            self._generate_exercises(exercise)

        serializer = self.get_serializer(exercise)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        exercise = self.get_object()
        queryset = ExerciseHistory.objects.filter(
            exercise=exercise, user=request.user
        ).order_by("-created_at")
        page = self.paginate_queryset(queryset)
        serializer = ExerciseHistorySerializer(
            page if page is not None else queryset, many=True
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class ActivityViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        interval = request.query_params.get("interval", "day")
        if interval not in {"day", "week", "month"}:
            raise ValidationError({"interval": "Use day, week, or month."})

        box_id = request.query_params.get("box")
        queryset = CardActivity.objects.filter(user=request.user)
        if box_id:
            try:
                queryset = queryset.filter(card__box_id=int(box_id))
            except (TypeError, ValueError):
                pass

        now = timezone.now()
        if interval == "day":
            count = 30
            start = now.date() - timedelta(days=count - 1)
            buckets = [start + timedelta(days=i) for i in range(count)]
            trunc = TruncDay("created_at")
            label_format = "%b %d"
        elif interval == "week":
            count = 24
            week_start = now.date() - timedelta(days=now.weekday())
            start = week_start - timedelta(weeks=count - 1)
            buckets = [start + timedelta(weeks=i) for i in range(count)]
            trunc = TruncWeek("created_at")
            label_format = "%b %d"
        else:
            count = 12
            current = date(now.year, now.month, 1)
            buckets = [current]
            while len(buckets) < count:
                month = buckets[0].month - 1 or 12
                year = buckets[0].year - (1 if buckets[0].month == 1 else 0)
                buckets.insert(0, date(year, month, 1))
            trunc = TruncMonth("created_at")
            label_format = "%b %y"

        activated_qs = (
            queryset.filter(action=CardActivity.Action.ACTIVATE)
            .annotate(bucket=trunc)
            .values("bucket")
            .annotate(count=Count("id"))
        )
        checked_qs = (
            queryset.filter(
                action__in=[
                    CardActivity.Action.ANSWER_CORRECT,
                    CardActivity.Action.ANSWER_INCORRECT,
                ]
            )
            .annotate(bucket=trunc)
            .values("bucket")
            .annotate(count=Count("id"))
        )
        levels_qs = (
            queryset.filter(
                action__in=[
                    CardActivity.Action.ANSWER_CORRECT,
                    CardActivity.Action.ANSWER_INCORRECT,
                ]
            )
            .annotate(bucket=trunc)
            .values("bucket", "card_level")
            .annotate(count=Count("id"))
        )

        def normalize_bucket(value):
            return value.date() if hasattr(value, "date") else value

        activated_map = {
            normalize_bucket(entry["bucket"]): entry["count"] for entry in activated_qs
        }
        checked_map = {
            normalize_bucket(entry["bucket"]): entry["count"] for entry in checked_qs
        }
        level_counts = {}
        for entry in levels_qs:
            bucket_value = normalize_bucket(entry["bucket"])
            level_counts.setdefault(bucket_value, {})
            level_counts[bucket_value][str(entry["card_level"])] = entry["count"]

        labels = []
        activated_series = []
        checked_series = []
        level_series = []
        for bucket in buckets:
            label = bucket.strftime(label_format)
            labels.append(label)
            activated_series.append(activated_map.get(bucket, 0))
            checked_series.append(checked_map.get(bucket, 0))
            level_entry = {"label": label}
            for level in range(0, 9):
                level_entry[f"level_{level}"] = level_counts.get(bucket, {}).get(
                    str(level),
                    0,
                )
            level_series.append(level_entry)

        return Response(
            {
                "labels": labels,
                "activated": activated_series,
                "checked": checked_series,
                "levels": level_series,
            }
        )


def _card_snapshot(card: Card):
    return {
        "id": card.id,
        "box_id": card.box_id,
        "finished": card.finished,
        "level": card.level,
        "group_id": card.group_id,
        "next_review_time": card.next_review_time.isoformat()
        if card.next_review_time
        else None,
        "config": card.config,
    }


# Create your views here.
