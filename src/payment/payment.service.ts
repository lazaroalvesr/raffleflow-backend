import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { TicketService } from '../ticket/ticket.service';

@Injectable()
export class PaymentService {
    processPayment() {
        throw new Error('Method not implemented.');
    }
    
    constructor(
        private prismaService: PrismaService,
        private ticketService: TicketService) { }

    private async logPaymentProcess(payment: any, status: string, tickets: number[]) {
        const ticketStates = await this.prismaService.availableTicket.findMany({
            where: {
                raffleId: payment.raffleId,
                ticketNumber: { in: tickets }
            },
            select: {
                ticketNumber: true,
                isReserved: true,
                isPurchased: true
            }
        });

    }

    async fetchPaymentStatus(paymentId: string, config: any) {

        try {
            const response = await axios.request(config);
            const paymentStatus = response.data.status;

            if (!paymentStatus) {
                throw new BadRequestException('Payment status not found in response');
            }

            await this.prismaService.$transaction(async (prisma) => {
                const payment = await prisma.payment.findUnique({
                    where: { transactionId: String(paymentId) }
                });

                if (!payment) {
                    throw new BadRequestException(`Payment not found: ${paymentId}`);
                }

                await this.logPaymentProcess(payment, paymentStatus, payment.ticketNumbers);

                await prisma.payment.update({
                    where: { transactionId: String(paymentId) },
                    data: { status: paymentStatus }
                });

                if (paymentStatus === 'approved') {

                    await this.ticketService.handlePaymentApproved(payment.id);

                    await this.logPaymentProcess(payment, 'approved', payment.ticketNumbers);
                    await this.logPaymentProcess(payment, 'approved', payment.ticketNumbers);

                } else if (['cancelled', 'rejected', 'refunded', 'charged_back'].includes(paymentStatus)) {
                    await prisma.availableTicket.updateMany({
                        where: {
                            raffleId: payment.raffleId,
                            ticketNumber: { in: payment.ticketNumbers }
                        },
                        data: {
                            isReserved: false,
                            isPurchased: false,
                            reservedUntil: null,
                        }
                    });

                    await this.logPaymentProcess(payment, 'cancelled/rejected', payment.ticketNumbers);
                }
            });

            return { message: 'Webhook received and processed successfully', response: response.data };

        } catch (error) {
            if (error.response) {
                throw new BadRequestException(`Error fetching payment: ${error.response.data.message}`);
            } else {
                throw new BadRequestException('Error fetching payment status');
            }
        }
    }

    async getById(userId: string) {
        const result = await this.prismaService.payment.findMany({
            where: { userId: userId },
            include: {
                raffle: {
                    select: {
                        _count: true,
                        tickets: true,
                        name: true,
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }

            }
        })

        return result
    }
}
