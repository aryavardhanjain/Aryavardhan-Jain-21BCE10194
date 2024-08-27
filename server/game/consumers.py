import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth.models import User
from .models import Game, Player, Character
from .serializers import GameSerializer

class GameConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Check if game exists, if not create one
        game, created = await sync_to_async(Game.objects.get_or_create)(game_id=self.room_name)

        if created:
            # If game is created, create the first player
            await sync_to_async(Player.objects.create)(
                user=self.scope['user'], game=game, player_identifier='A', is_turn=True
            )
            await self.send(text_data=json.dumps({
                'status': 'Game initialized',
                'game_id': game.game_id,
                'game_state': GameSerializer(game).data
            }))
        else:
            # If game already exists, add the second player
            if game.players.count() < 2:
                await sync_to_async(Player.objects.create)(
                    user=self.scope['user'], game=game, player_identifier='B'
                )
                await self.send(text_data=json.dumps({
                    'status': 'Game joined',
                    'game_id': game.game_id,
                    'game_state': GameSerializer(game).data
                }))
            else:
                # If game is full, reject the connection
                await self.close()



    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        event_type = text_data_json.get('event')

        if event_type == 'move':
            await self.handle_move(text_data_json)
        elif event_type == 'initialize_game':
            await self.initialize_game(text_data_json)

    async def handle_move(self, data):
        game_id = data['game_id']
        character_id = data['character_id']
        move = data['move']

        try:
            game = await sync_to_async(Game.objects.get)(game_id=game_id)
            player = await sync_to_async(Player.objects.get)(game=game, user=self.scope['user'])
            character = await sync_to_async(Character.objects.get)(id=character_id, player=player)

            if not player.is_turn:
                await self.send(text_data=json.dumps({
                    'status': 'Not your turn'
                }))
                return

            move_successful = await sync_to_async(game.move_character)(character, move)

            if move_successful:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_move',
                        'move': move
                    }
                )
            else:
                await self.send(text_data=json.dumps({
                    'status': 'Invalid move'
                }))

        except Game.DoesNotExist:
            await self.send(text_data=json.dumps({
                'status': 'Invalid game'
            }))
        except Character.DoesNotExist:
            await self.send(text_data=json.dumps({
                'status': 'Invalid character'
            }))


    async def initialize_game(self, data):
        user = self.scope['user']
        opponent_username = data['opponent']
        
        try:
            opponent_user = await sync_to_async(User.objects.get)(username=opponent_username)
            game = await sync_to_async(Game.objects.create)(game_id=f'{user.username}_vs_{opponent_user.username}')
            await sync_to_async(Player.objects.create)(user=user, game=game, player_identifier='A', is_turn=True)
            await sync_to_async(Player.objects.create)(user=opponent_user, game=game, player_identifier='B')

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_initialized',
                    'game_id': game.game_id,
                    'status': 'Game initialized',
                    'game_state': GameSerializer(game).data
                }
            )
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({
                'error': 'Opponent user does not exist.'
            }))

    async def game_move(self, event):
        move = event['move']
        await self.send(text_data=json.dumps({
            'move': move
        }))

    async def game_initialized(self, event):
        await self.send(text_data=json.dumps({
            'status': event['status'],
            'game_id': event['game_id'],
            'game_state': event['game_state']
        }))
