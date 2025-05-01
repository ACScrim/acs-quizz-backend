import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import * as passport from 'passport';
import { DiscordRefreshInterceptor } from './auth/discord.interceptor';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

  //  Enable Websocket support
  app.useWebSocketAdapter(new WsAdapter(app));

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // Add Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ACS Quizz API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'default_secret',
      resave: false,
      saveUninitialized: false
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  const usersService = app.get(UsersService);
  app.useGlobalInterceptors(new DiscordRefreshInterceptor(usersService));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
