from django.db import models

# Create your models here.
class Game(models.Model):
    game_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    winner = models.ForeignKey('Player', null=True, blank=True, on_delete=models.SET_NULL, related_name='won_games')
    move_in_progress = models.BooleanField(default=False)

    def __str__(self):
        return self.game_id
    
    def move_character(self, character, move):
        if self.move_in_progress:
            return False 
        
        self.move_in_progress = True
        self.save()

        new_x, new_y = self.calculate_position(character, move)

        if not (0 <= new_x < 5 and 0 <= new_y < 5):
            self.move_in_progress = False
            self.save()
            return False
        
        target_character = self.characters.filter(x_position=new_x, y_position=new_y, alive=True).first()
        if target_character and target_character.player != character.player:
            self.resolve_combat(character, target_character)

        character.x_position = new_x
        character.y_position = new_y
        character.save()

        self.toggle_turns()

        self.check_winner()

        self.move_in_progress = False
        self.save()
        return True
    
    def calculate_position(self, character, move):
        directions = {
            'L': (-1, 0), 'R': (1, 0), 'F': (0, 1), 'B': (0, -1), 'FL': (-1, 1), 'FR': (1, 1), 'BL': (-1, -1), 'BR': (1, -1)
        }

        dx, dy = directions.get(move, (0, 0))
        new_x = character.x_position + dx * (2 if character.character_type in ['H1', 'H2'] else 1)
        new_y = character.y_position + dy * (2 if character.character_type in ['H1', 'H2'] else 1)

        return new_x, new_y
    
    def resolve_combat(self, attacker, defender):
        defender.alive = False
        defender.save()

    def toggle_turns(self):
        for player in self.players.all():
            player.is_turn = not player.is_turn
            player.save()

    def check_winner(self):
        for player in self.players.all():
            if not player.characters.filter(alive=True).exists():
                self.winner = player.opponent()
                self.completed = True
                self.save()
                return True
        return False
    
class Player(models.Model):
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='players')
    is_turn = models.BooleanField(default=False)
    player_identifier = models.CharField(max_length=1)

    def __str__(self):
        return f"{self.user.username} ({self.player_identifier})"
    
    def opponent(self):
        return self.game.players.exclude(id=self.id).first()
    
class Character(models.Model):
    CHARACTER_TYPES = [
        ('P', 'Pawn'),
        ('H1', 'Hero1'),
        ('H2', 'Hero2')
    ]

    character_type = models.CharField(max_length=2, choices=CHARACTER_TYPES)
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='characters')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='characters')
    x_position = models.IntegerField()
    y_position = models.IntegerField()
    alive = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.character_type} ({self.x_position}, {self.y_position})"