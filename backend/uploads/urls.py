from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UploadViewSet

router = DefaultRouter()
router.register(r"uploads", UploadViewSet, basename="upload")

urlpatterns = [
    path("", include(router.urls)),
]
