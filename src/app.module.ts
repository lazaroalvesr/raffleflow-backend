import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from './lib/mailer.config';

@Module({
  imports: [
    MailerModule.forRoot(mailerConfig),
    PrismaModule, AuthModule,
    ConfigModule.forRoot({
      isGlobal: true
    })],
  controllers: [],
  providers: [{
    provide: APP_GUARD,
    useClass: JwtAuthGuard
  }],
})
export class AppModule { }
