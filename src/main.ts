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


  app.use(helmet());

  app.use(cookieParser());

  app.use(new CsrfMiddleware().use);

  app.set('trust proxy', 1);

  await app.listen(process.env.PORT || 3025);
}

bootstrap();
