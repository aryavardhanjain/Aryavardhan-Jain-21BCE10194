from rest_framework import serializers
from .models import Game, Player, Character

class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ['id', 'character_type', 'x_position', 'y_position', 'alive']

class PlayerSerializer(serializers.ModelSerializer):
    characters = CharacterSerializer(many=True, read_only=True)

    class Meta:
        model = Player
        fields = ['id', 'user', 'player_identifier', 'is_turn', 'characters']

class GameSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)
    winner = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Game
        fields = ['id', 'game_id', 'created_at', 'completed', 'winner', 'players']
