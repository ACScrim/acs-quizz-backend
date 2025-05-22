import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLobbyDto } from './dto/create-lobby.dto';
import { UpdateLobbyDto } from './dto/update-lobby.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Lobby } from './entities/lobby.entity';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { JoinLobbyDto } from './dto/join-lobby.dto';
import { Quiz } from 'src/quizzes/entities/quiz.entity';

@Injectable()
export class LobbiesService {
  constructor(
    @InjectModel(Lobby.name) private lobbyModel: Model<Lobby>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Quiz.name) private quizModel: Model<Quiz>
  ) {}

  async create(createLobbyDto: CreateLobbyDto, ownerId: string) {
    const owner = await this.userModel.findById(ownerId) as User;
    if (!owner) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    const newLobby = new this.lobbyModel(createLobbyDto);

    newLobby.owner = owner;
    newLobby.players = [owner];
    newLobby.code = Math.random().toString(36).substring(2, 8);
    newLobby.isPublic = createLobbyDto.isPublic;
    newLobby.name = createLobbyDto.name || `Partie de ${owner.username}`;

    await this.checkPlayersInLobby(newLobby);

    if ((await this.lobbyModel.find({ players: ownerId}).exec()).length > 0) {
      throw new NotFoundException('Vous ne pouvez pas créer plusieurs parties');
    }

    return newLobby.save();
  }

  findAllPublic() {
    return this.lobbyModel
      .find({ isPublic: true })
      .populate('owner')
      .exec();
  }

  findMine(user: User) {
    return this.lobbyModel
      .findOne({ owner: user.id })
      .select('_id')
      .exec();
  }

  async findOne(id: string) {
    if (!id) {
      throw new NotFoundException('Lobby introuvable');
    }
    const lobby = await this.findLobbyById(id);
    const activeQuizz = await this.quizModel.findOne({ lobby: id });
    return {
      ...((await (await lobby.populate('owner')).populate('players')).toJSON()),
      activeQuizz
    };
  }

  async update(id: string, updateLobbyDto: UpdateLobbyDto) {
    if (!id) {
      throw new NotFoundException('Lobby introuvable');
    }
    const lobby = await this.findLobbyById(id);
    if (!lobby) {
      throw new NotFoundException('Lobby introuvable');
    }
    return lobby.updateOne(updateLobbyDto, { new: true })
      .then(() => this.findLobbyById(id));
  }

  async remove(id: string) {
    if (!id) {
      throw new NotFoundException('Lobby introuvable');
    }
    const lobby = await this.findLobbyById(id);
    if (!lobby) {
      throw new NotFoundException('Lobby introuvable');
    }
    return lobby.deleteOne();
  }

  async checkPlayersInLobby(lobby: Lobby) {
    for (let player of lobby.players) {
      const user = await this.userModel.findOne({ _id: player });
      if (!user) {
        throw new NotFoundException(`Utilisateur ${player} introuvable`);
      }
    }
  }

  async join(user: User, joinLobbyDto: JoinLobbyDto) {
    const lobby = await this.findLobbyByCode(joinLobbyDto.code);
    if (lobby.players.includes(user.id)) {
      throw new NotFoundException('Vous êtes déjà dans cette partie');
    }
    lobby.players.push(user);
    await this.checkPlayersInLobby(lobby);
    return (await (await lobby.save()).populate('owner')).populate('players');
  }

  async leave(userId: string, id: string) {
    const lobby = await this.findLobbyById(id);
    if (!(lobby.players as unknown as string[]).includes(userId)) {
      throw new NotFoundException('Vous n\'êtes pas dans cette partie');
    }
    lobby.players = lobby.players.filter((player) => String(player) !== userId);
    console.log('Lobby players:', lobby.players);
    if (lobby.players.length === 0) {
      await this.remove(lobby.id);
      return;
    }
    if (userId === (String(lobby.owner))) {
      lobby.owner = lobby.players[0] || null;
    }
    await this.checkPlayersInLobby(lobby);
    return (await (await lobby.save()).populate('owner')).populate('players');
  }

  async findLobbyByCode(code: string) {
    const lobby = await this.lobbyModel.findOne({ code });
    if (!lobby) {
      throw new NotFoundException('Lobby introuvable');
    }
    return lobby;
  }

  async findLobbyById(id: string) {
    const lobby = await this.lobbyModel.findById(id);
    if (!lobby) {
      throw new NotFoundException('Lobby introuvable');
    }
    return lobby;
  }
}
