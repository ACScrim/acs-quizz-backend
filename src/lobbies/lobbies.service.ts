import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLobbyDto } from './dto/create-lobby.dto';
import { UpdateLobbyDto } from './dto/update-lobby.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Lobby } from './entities/lobby.entity';
import { Model } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class LobbiesService {
  constructor(
    @InjectModel(Lobby.name) private lobbyModel: Model<Lobby>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async create(createLobbyDto: CreateLobbyDto, owner: User) {
    if (!owner) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    const newLobby = new this.lobbyModel(createLobbyDto);

    newLobby.owner = owner;
    newLobby.players = [owner];
    newLobby.code = Math.random().toString(36).substring(2, 8);
    newLobby.isPublic = createLobbyDto.isPublic || false;
    newLobby.name = createLobbyDto.name || `Partie de ${owner.username}`;

    await this.checkPlayersInLobby(newLobby);

    return newLobby.save();
  }

  findAll() {
    return `This action returns all lobbies`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lobby`;
  }

  update(id: number, updateLobbyDto: UpdateLobbyDto) {
    return `This action updates a #${id} lobby`;
  }

  remove(id: number) {
    return `This action removes a #${id} lobby`;
  }

  async checkPlayersInLobby(lobby: Lobby) {
    for (let player of lobby.players) {
      const user = await this.userModel.findOne({ _id: player });
      if (!user) {
        throw new NotFoundException(`Utilisateur ${player} introuvable`);
      }
    }
  }
}
