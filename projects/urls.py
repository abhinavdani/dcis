from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
router = DefaultRouter()
router.register(r'projects', views.ProjectViewSet, basename='project')
urlpatterns = [
    path('', include(router.urls)),
    path('overview/', views.overview),
    path('alerts/', views.alerts_list),
    path('auth/login/', views.login_view),
    path('health/', views.health),
]
