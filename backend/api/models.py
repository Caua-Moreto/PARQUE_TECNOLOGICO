from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="categories")
    def __str__(self): return self.name

class FieldDefinition(models.Model):
    FIELD_TYPE_CHOICES = [('text', 'Texto'), ('number', 'Número'), ('date', 'Data')]
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='field_definitions')
    name = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES, default='text')
    def __str__(self): return f"{self.category.name} - {self.name}"

class Asset(models.Model):

    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('em_uso', 'Em Uso'),
        ('manutencao', 'Em Manutenção'),
        ('inativo', 'Inativo/Descartado')
    ]
    
    patrimonio = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='assets')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="assets")
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='disponivel')

    def __str__(self): return self.patrimonio

class AssetFieldValue(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='field_values')
    field_definition = models.ForeignKey(FieldDefinition, on_delete=models.CASCADE)
    value = models.TextField()
    def __str__(self): return f"{self.asset.patrimonio} - {self.field_definition.name}: {self.value}"

class Profile(models.Model):
    ROLE_CHOICES = (
        ('viewer', 'Visualizador'),
        ('editor', 'Editor'),
        ('admin', 'Administrador'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    secret_question = models.CharField(max_length=255, blank=True, null=True)
    secret_answer = models.CharField(max_length=128, blank=True, null=True)
    # Define o papel do usuário, com "Visualizador" como padrão.
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

# Este "signal" garante que um Profile seja criado automaticamente sempre que um novo User for registrado
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)