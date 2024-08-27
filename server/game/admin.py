from django.contrib import admin
from .models import Character, Player, Game

# Register your models here.
admin.site.register(Character)
admin.site.register(Player)
admin.site.register(Game)