from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from rest_framework import generics, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    CreateUserSerializer,
    CategorySerializer,
    AssetSerializer,
    AdminUserSerializer,
    UserProfileSerializer,
    FieldDefinitionSerializer,
    CustomTokenObtainPairSerializer,
)

# Importa as classes de permissão do DRF.
from rest_framework.permissions import IsAuthenticated, AllowAny

# Importa os modelos do banco de dados.
from .models import Asset, Category, FieldDefinition
from .permissions import IsAdminUser, IsAdminOrEditorUser

# --- View para criação de novos usuários ---
# generics.CreateAPIView é uma view genérica que fornece apenas a funcionalidade de POST (criação).
class CreateUserView(generics.CreateAPIView):
    # O queryset base para a view. Embora seja para criação, o DRF ainda o exige.
    queryset = User.objects.all()
    # O serializer que será usado para validar e desserializar os dados de entrada.
    serializer_class = CreateUserSerializer # Use o novo serializer
    # Define as permissões para esta view. `AllowAny` permite que qualquer um
    # (autenticado ou não) acesse este endpoint, o que é necessário para o registro.
    permission_classes = [AllowAny]


# --- ViewSet para o modelo Category ---
# viewsets.ModelViewSet é um conjunto de views que fornece automaticamente as ações
# `list` (GET), `create` (POST), `retrieve` (GET /id), `update` (PUT/PATCH /id),
# e `destroy` (DELETE /id).
class CategoryViewSet(viewsets.ModelViewSet):
    # O serializer a ser usado para as categorias.
    serializer_class = CategorySerializer

    # Sobrescreve o método que retorna o queryset.
    def get_queryset(self):
        
        # Filtra as categorias para retornar apenas aquelas que pertencem (`owner`)
        # ao usuário que está fazendo a requisição (`self.request.user`).
        # Isso impede que um usuário veja as categorias de outro.
        # return Category.objects.filter(owner=self.request.user)

        return Category.objects.all()

    def get_permissions(self):
        # Apenas Admins podem criar, editar ou deletar
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser]
        # Qualquer usuário logado pode listar ou ver detalhes
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    # Ao criar, associa o owner (pode ser útil saber quem criou em uma feature futura)
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# --- ViewSet para o modelo Asset ---
class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer

    def get_queryset(self):
        # Todos os usuários logados podem ver todos os ativos
        queryset = Asset.objects.all()
        # Permite filtrar por categoria, como antes
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def get_permissions(self):
        # Admins e Editores podem criar, editar ou deletar
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminOrEditorUser]
        # Qualquer usuário logado pode ver
        else:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# --- View para listar e criar FieldDefinitions para uma categoria específica ---
# generics.ListCreateAPIView fornece os métodos GET (para listar) e POST (para criar).
class FieldDefinitionListCreateView(generics.ListCreateAPIView):
    serializer_class = FieldDefinitionSerializer
    # permission_classes = [IsAuthenticated]
    permission_classes = [IsAdminOrEditorUser]

    # Sobrescreve o método para buscar os objetos.
    def get_queryset(self):
        # Pega o ID da categoria a partir dos parâmetros da URL.
        # A URL para esta view seria algo como /api/categories/<category_pk>/fields/.
        category_id = self.kwargs["category_pk"]
        # Retorna apenas as definições de campo que pertencem à categoria especificada.
        return FieldDefinition.objects.filter(category_id=category_id)

    # Hook chamado na criação de uma nova definição de campo.
    def perform_create(self, serializer):
        # Pega o ID da categoria da URL novamente.
        category_id = self.kwargs["category_pk"]
        # Busca a instância da categoria, garantindo que ela pertence ao usuário logado
        # para que um usuário não possa adicionar campos a categorias de outros.
        category = Category.objects.get(pk=category_id, owner=self.request.user)
        # Salva a nova definição de campo, associando-a à categoria correta.
        serializer.save(category=category)


# --- View para manipular uma única FieldDefinition (detalhe, atualização, exclusão) ---
# generics.RetrieveUpdateDestroyAPIView fornece os métodos GET /id, PUT/PATCH /id e DELETE /id.
class FieldDefinitionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FieldDefinitionSerializer
    # permission_classes = [IsAuthenticated]
    permission_classes = [IsAdminOrEditorUser]

    # Sobrescreve o método para buscar os objetos.
    def get_queryset(self):
        # Garante a segurança retornando um queryset que contém apenas
        # FieldDefinitions cujas categorias pertencem ao usuário logado.
        # A sintaxe `category__owner` atravessa a relação de ForeignKey.
        # Mesmo que um usuário tente acessar /api/.../fields/123, se o campo 123
        # não pertencer a uma de suas categorias, o DRF retornará "Não encontrado".
        return FieldDefinition.objects.filter(category__owner=self.request.user)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminUser]

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

    def perform_destroy(self, instance):
        # Impede que o usuário delete a si mesmo
        if instance == self.request.user:
             # Levanta um erro de validação ou permissão
             from rest_framework.exceptions import PermissionDenied
             raise PermissionDenied("Você não pode excluir sua própria conta.")
        instance.delete()

class UserRoleUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, pk, *args, **kwargs):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        if user.id == request.user.id:
            return Response({'error': 'Você não pode alterar seu próprio cargo.'}, status=status.HTTP_403_FORBIDDEN)

        new_role = request.data.get('role')
        if new_role not in ['viewer', 'editor', 'admin']:
            return Response({'error': 'Papel inválido.'}, status=status.HTTP_400_BAD_REQUEST)

        user.profile.role = new_role
        user.profile.save()
        return Response({'message': f'Papel do usuário {user.username} atualizado para {new_role}.'}, status=status.HTTP_200_OK)


class GetSecretQuestionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        try:
            user = User.objects.get(username=username)
            if user.profile.secret_question:
                return Response({"secret_question": user.profile.secret_question})
            else:
                return Response(
                    {"error": "Usuário não configurou uma pergunta secreta."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND
            )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        answer = request.data.get("secret_answer")
        new_password = request.data.get("new_password")

        if not all([username, answer, new_password]):
            return Response(
                {"error": "Todos os campos são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(username=username)
            # Verifica se a resposta fornecida bate com o hash salvo no banco
            if check_password(answer, user.profile.secret_answer):
                user.set_password(new_password)  # Define a nova senha (já faz o hash)
                user.save()
                return Response(
                    {"message": "Senha alterada com sucesso!"},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Resposta secreta incorreta."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except User.DoesNotExist:
            return Response(
                {"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND
            )

# Classe para visualizarmos role no frontend
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer