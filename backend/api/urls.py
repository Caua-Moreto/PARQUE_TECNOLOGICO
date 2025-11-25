from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, 
    AssetViewSet, 
    FieldDefinitionListCreateView, 
    FieldDefinitionDetailView,
    GetSecretQuestionView,
    ResetPasswordView,
    UserListView,
    UserRoleUpdateView,
    CreateUserView, 
    CustomTokenObtainPairView
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'assets', AssetViewSet, basename='asset')

urlpatterns = [
    path('', include(router.urls)),
    # Rota para listar e criar campos de uma categoria
    path('categories/<int:category_pk>/fields/', FieldDefinitionListCreateView.as_view(), name='field-definition-list'),
    # Rota com o token personalizado para identificarmos a role no frontend
    path("api/token/", CustomTokenObtainPairView.as_view(), name="get_token"),
    # Rota para deletar, atualizar ou ver um campo específico
    # Ex: DELETE /api/fields/5/
    path('fields/<int:pk>/', FieldDefinitionDetailView.as_view(), name='field-definition-detail'),
    # Rotas de pergunta secreta
    path('user/get-secret-question/', GetSecretQuestionView.as_view(), name='get-secret-question'),
    path('user/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    # Rotas para dar update na permissão de usuário
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/update-role/', UserRoleUpdateView.as_view(), name='user-update-role'),
]