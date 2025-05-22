import { forwardRef, Module } from '@nestjs/common';
import { LobbiesService } from './lobbies.service';
import { LobbiesController } from './lobbies.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Lobby, LobbySchema } from './entities/lobby.entity';
import { UsersModule } from 'src/users/users.module';
import { QuizzesModule } from 'src/quizzes/quizzes.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Lobby.name, schema: LobbySchema
      }
    ]),
    UsersModule,
    forwardRef(() => QuizzesModule)
  ],
  controllers: [LobbiesController],
  providers: [LobbiesService],
  exports: [MongooseModule, LobbiesService]
})
export class LobbiesModule {}
