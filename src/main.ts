import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe());

  // Set up guards globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Enable cookie parsing and helmet for security headers
  app.use(cookieParser());
  app.use(helmet());

  // CSRF Protection Middleware
  app.use(
    csurf({
      cookie: {
        httpOnly: true,  // Only accessible by the server
        sameSite: 'strict',  // CSRF protection
        secure: process.env.NODE_ENV === 'production',  // Use secure cookies in production
      },
      value: (req) => req.cookies['XSRF-TOKEN'],  // Token sent in the XSRF-TOKEN cookie
    })
  );

  // Trust proxy for environments behind a reverse proxy (e.g., Heroku)
  app.set('trust proxy', 1);

  // Start the application
  await app.listen(3025);
}

bootstrap();
