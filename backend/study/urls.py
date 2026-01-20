from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import BoxViewSet, CardViewSet

router = DefaultRouter()
router.register(r"boxes", BoxViewSet, basename="box")
router.register(r"cards", CardViewSet, basename="card")

urlpatterns = [
    path("", include(router.urls)),
]
