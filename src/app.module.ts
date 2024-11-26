import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfig } from './lib/mailer.config';
import { PaymentModule } from './payment/payment.module';
import { RaffleModule } from './raffle/raffle.module';
import { TicketModule } from './ticket/ticket.module';
import { WebHookModule } from './web-hook/web-hook.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CsrfModule } from './csrf/csrf.module';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import { CsrfController } from './csrf/csrf.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
    MailerModule.forRoot(mailerConfig),
    PrismaModule,
    AuthModule,
    PaymentModule,
    RaffleModule,
    TicketModule,
    WebHookModule,
    CsrfModule,
    ConfigModule.forRoot({
      isGlobal: true
    })
  ],
  controllers: [CsrfController],
  providers: [{
    provide: APP_GUARD,
    useClass: JwtAuthGuard
  }],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware) 
      .exclude(
        { path: '/auth/create', method: RequestMethod.POST }, 
        { path: '/auth/login', method: RequestMethod.POST },
        { path: '/raffle/getAll', method: RequestMethod.GET }, 
        { path: '/raffle/getById', method: RequestMethod.GET } 
      )
      .forRoutes('*'); 
  }
}