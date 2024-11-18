import { Module } from '@nestjs/common';
import { WebhookController } from './web-hook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { TicketService } from '../ticket/ticket.service';

@Module({
  controllers: [WebhookController],
  providers: [PrismaService, PaymentService, TicketService]
})
export class WebHookModule { }
