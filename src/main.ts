import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import * as passport from 'passport';
import { AppModule } from './app.module';
import { DiscordRefreshInterceptor } from './auth/discord.interceptor';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // Add Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ACS Quizz API')
    .setVersion('1.0')
    .addBearerAuth()
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

  app.enableCors({
    origin: [
      "http://localhost:3000", // Remplace par l'URL de ton frontend
      "http://localhost:5173", // Ajoute d'autres origines si besoin
    ],
    credentials: true, // Autorise les cookies/headers d'auth
  });

  const usersService = app.get(UsersService);
  app.useGlobalInterceptors(new DiscordRefreshInterceptor(usersService));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
