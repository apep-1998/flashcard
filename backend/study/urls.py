from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet, BoxViewSet, CardViewSet, ExerciseViewSet

router = DefaultRouter()
router.register(r"boxes", BoxViewSet, basename="box")
router.register(r"cards", CardViewSet, basename="card")
router.register(r"exercises", ExerciseViewSet, basename="exercise")
router.register(r"activity", ActivityViewSet, basename="activity")

urlpatterns = [
    path("", include(router.urls)),
]
