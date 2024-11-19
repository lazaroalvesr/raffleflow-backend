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
        console.log('=== Payment Process Log ===');
        console.log('Payment ID:', payment.transactionId);
        console.log('New Status:', status);
        console.log('Affected Tickets:', tickets);
        console.log('Raffle ID:', payment.raffleId);

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

        console.log('Ticket States:', ticketStates);
        console.log('========================');
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
                }
            });

            return { message: 'Webhook processed successfully', response: response.data };
        } catch (error) {
            if (error.response) {
                throw new BadRequestException(`Error fetching payment: ${error.response.data.message}`);
            }
            throw new BadRequestException('Error processing payment webhook');
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


/*

    async updatePaymentStatus(paymentId: string, paymentStatus: string, ticketNumbers: number[]) {
        const statusEnum: PaymentStatus = paymentStatus as PaymentStatus;

        return this.prismaService.$transaction(async (prisma) => {
            const payment = await prisma.payment.findUnique({
                where: { transactionId: String(paymentId) },
            });

            if (!payment) {
                throw new BadRequestException(`Payment not found: ${paymentId}`);
            }

            await prisma.payment.update({
                where: { transactionId: String(paymentId) },
                data: { status: statusEnum },
            });

            if (statusEnum === PaymentStatus.approved) {
                await prisma.availableTicket.updateMany({
                    where: {
                        raffleId: payment.raffleId,
                        ticketNumber: { in: ticketNumbers },
                    },
                    data: {
                        isReserved: true,
                        isPurchased: true,
                    },
                });
            } else if ([PaymentStatus.cancelled, PaymentStatus.rejectd, PaymentStatus.pending].includes(statusEnum)) {
                await prisma.availableTicket.updateMany({
                    where: {
                        raffleId: payment.raffleId,
                        ticketNumber: { in: ticketNumbers },
                    },
                    data: {
                        isReserved: false,
                        isPurchased: false,
                        reservedUntil: null,
                    },
                });
            }
        });
    }

    async createTickets(userId: string, raffleId: string, ticketNumbers: number[]) {
        return this.prismaService.$transaction(async (prisma) => {
            const ticketsToCreate = ticketNumbers.map(ticketNumber => ({
                userId: userId,
                raffleId: raffleId,
                ticketNumber: ticketNumber,
                isPurchased: true, // You can set other default values if necessary
            }));

            try {
                await prisma.availableTicket.createMany({
                    data: ticketsToCreate,
                });
            } catch (error) {
                console.error('Error creating tickets:', error);
                throw new BadRequestException('Error creating tickets');
            }
        });
    }

*/