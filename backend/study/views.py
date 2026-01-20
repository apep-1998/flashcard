from base64 import b64encode
from datetime import timedelta
from uuid import uuid4

from django.urls import reverse_lazy
from django.utils import timezone
from google import genai
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .ai_models import Review, prompt_ai_review
from .models import Box, Card, CardActivity, AiReviewLog
from .serializers import BoxSerializer, CardSerializer


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
            .only("id", "group_id", "created_at")
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
        if group_ids:
            updated += Card.objects.filter(
                box=box,
                user=request.user,
                level=0,
                next_review_time__isnull=True,
                group_id__in=group_ids,
            ).update(level=1, next_review_time=now)

        if id_groups:
            updated += Card.objects.filter(
                box=box,
                user=request.user,
                level=0,
                next_review_time__isnull=True,
                id__in=id_groups,
            ).update(level=1, next_review_time=now)

        return Response({"activated": updated, "groups": groups})

    @action(detail=True, methods=["post"], url_path="delete-cards")
    def delete_cards(self, request, pk=None):
        box = self.get_object()
        deleted, _ = Card.objects.filter(
            box=box, user=request.user
        ).delete()
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

    def perform_update(self, serializer):
        config = serializer.validated_data.get("config")
        if config is not None:
            config = self._apply_tts(config)
            serializer.save(config=config)
        else:
            serializer.save()

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


# Create your views here.
