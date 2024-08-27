from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Game, Player, Character
from .serializers import GameSerializer, PlayerSerializer, CharacterSerializer
from django.contrib.auth.models import User
# Create your views here.

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        game = self.get_object()
        player = game.players.get(user=request.user)

        if not player.is_turn:
            return Response({'status': 'Not your turn'}, status=status.HTTP_400_BAD_REQUEST)
        
        character_id = request.data.get('character_id')
        move = request.data.get('move')

        character = Character.objects.get(id=character_id, player=player)

        if game.move_character(character, move):
            if game.check_winner():
                return Response({'status': "Game Over", 'winner': game.winner.user.username})
            return Response({'status': 'Move successful', 'game_state': GameSerializer(game).data})
        else:
            return Response({'status': 'Invalid move'}, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=False, methods=['post'])
    def create_game(self, request):
        user = request.user
        opponent_username = request.data.get('opponent')
        opponent_user = User.objects.get(username=opponent_username)

        game = Game.objects.create(game_id=f'{user.username}_vs_{opponent_user.username}')
        Player.objects.create(user=user, game=game, player_identifier='A', is_turn=True)
        Player.objects.create(user=opponent_user, game=game, player_identifier='B')

        return Response({'status': 'Game created', 'game': GameSerializer(game).data})

    @action(detail=True, methods=['get'])
    def game_state(self, request, pk=None):
        game = self.get_object()
        return Response(GameSerializer(game).data)
    
    @action(detail=True, methods=['post'])
    def quit(self, request, pk=None):
        game = self.get_object()
        player = game.players.get(user=request.user)
        opponent = player.opponent()

        game.winner = opponent
        game.completed = True
        game.save()

        return Response({'status': 'Player quit', 'winner': opponent.user.username})

