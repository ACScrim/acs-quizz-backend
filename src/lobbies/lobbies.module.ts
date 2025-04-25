import { Module } from '@nestjs/common';
import { LobbiesService } from './lobbies.service';
import { LobbiesController } from './lobbies.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Lobby, LobbySchema } from './entities/lobby.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Lobby.name, schema: LobbySchema
      }
    ])
  ],
  controllers: [LobbiesController],
  providers: [LobbiesService],
})
export class LobbiesModule {}
