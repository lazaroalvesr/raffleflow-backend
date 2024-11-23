import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.enableCors({
    origin: ['https://raffle-master-front.vercel.app'], // Certifique-se de que a origem está correta
    credentials: true, // Permite envio de cookies e autenticação com credenciais
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // Métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-CSRF-Token'], // Cabeçalhos permitidos
    exposedHeaders: ['X-CSRF-Token'], // Cabeçalhos que o navegador pode acessar
  });
  

  app.use(helmet());

  app.use(cookieParser());

  app.use(new CsrfMiddleware().use);

  app.set('trust proxy', 1);

  await app.listen(process.env.PORT || 3025);
}

bootstrap();
