import { Module } from '@nestjs/common';
import { LobbiesService } from './lobbies.service';
import { LobbiesController } from './lobbies.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Lobby, LobbySchema } from './entities/lobby.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Lobby.name, schema: LobbySchema
      }
    ]),
    UsersModule
  ],
  controllers: [LobbiesController],
  providers: [LobbiesService],
  exports: [MongooseModule]
})
export class LobbiesModule {}
