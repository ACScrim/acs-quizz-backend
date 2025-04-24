import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestWsGateway } from './test-ws/test-ws.gateway';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/acs-quizz')
  ],
  controllers: [AppController],
  providers: [AppService, TestWsGateway],
})
export class AppModule {}
