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

  // Configuração do CORS
  app.enableCors({
    origin: [
      'https://raffle-master-front.vercel.app',
      // Adicione outras origens conforme necessário
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true, // Importante para autenticação
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 86400, // Cache preflight por 24 horas
  });

  // Configuração do Helmet (com ajustes para compatibilidade)
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
      crossOriginOpenerPolicy: {
        policy: 'same-origin',
      },
    }),
  );

  // Pipes e Guards globais
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Remove propriedades não decoradas
      forbidNonWhitelisted: true, // Rejeita propriedades não decoradas
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Middlewares
  app.use(cookieParser());
  app.use(new CsrfMiddleware().use);

  // Configurações adicionais
  app.set('trust proxy', 1);

  // Configurar prefixo global da API (opcional)
  app.setGlobalPrefix('api');

  // Iniciar servidor
  await app.listen(process.env.PORT || 3025);
}

bootstrap();