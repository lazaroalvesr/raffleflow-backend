import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { CreateTicketDTO } from '../dto/ticket/CreateTicketDTO';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

const client = new MercadoPagoConfig({
    accessToken: ACCESS_TOKEN,
});
const payment = new Payment(client);

@Injectable()
export class TicketService {
    private readonly logger = new Logger(TicketService.name);

    constructor(private prismaService: PrismaService) { }

    async create(body: CreateTicketDTO): Promise<{ paymentDetails: any; generatedNumbers: number[] }> {
        const userExists = await this.prismaService.user.findUnique({
            where: { id: body.userId },
        });

        if (!userExists) {
            throw new BadRequestException('User does not exist.');
        }

        return this.prismaService.$transaction(async (prisma) => {
            const raffle = await prisma.raffle.findUnique({
                where: { id: body.raffleId },
                select: {
                    endDate: true,
                    id: true,
                    ticketPrice: true,
                    description: true,
                    AvailableTicket: {
                        where: {
                            isReserved: false,
                            isPurchased: false
                        },
                        select: { ticketNumber: true },
                    },
                },
            });

            if (!raffle) {
                throw new BadRequestException('Raffle not found.');
            }

            if (new Date() > raffle.endDate) {
                throw new BadRequestException('Raffle has ended. Tickets can no longer be purchased.');
            }

            const pricePerTicket = parseFloat(raffle.ticketPrice);
            const quantity = body.quantity;
            const priceTotal = pricePerTicket * quantity;


            if (raffle.AvailableTicket.length < quantity) {
                throw new BadRequestException('Not enough available tickets.');
            }

            const expirationDate = new Date();
            expirationDate.setMinutes(expirationDate.getMinutes() + 10);
            this.logger.log(`Payment expiration date: ${expirationDate.toISOString()}`);

            const generatedNumbers = raffle.AvailableTicket.slice(0, quantity).map((ticket) => ticket.ticketNumber);

            const uniqueIdempotencyKey = `key-${Date.now()}-${Math.random()}`;
            this.logger.log(`Idempotency key: ${uniqueIdempotencyKey}`);


            const getRandomAvailableTickets = async (
                prisma,
                raffleId: string,
                quantity: number
            ): Promise<number[]> => {
                const availableTickets = await prisma.availableTicket.findMany({
                    where: {
                        raffleId: raffleId,
                        isReserved: false,
                        isPurchased: false,
                    },
                    select: {
                        ticketNumber: true,
                    },
                });

                if (availableTickets.length < quantity) {
                    throw new Error('Não há tickets suficientes disponíveis');
                }

                const shuffledTickets = availableTickets.map((t: { ticketNumber: any; }) => t.ticketNumber);
                for (let i = shuffledTickets.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledTickets[i], shuffledTickets[j]] = [shuffledTickets[j], shuffledTickets[i]];
                }

                const selectedTickets = shuffledTickets.slice(0, quantity);

                const formattedTickets = selectedTickets.map((num: number) => {
                    return parseInt(num < 10 ? `0${num}` : `${num}`);
                });

                return formattedTickets;
            };


            try {
                const generatedNumbers = await getRandomAvailableTickets(
                    this.prismaService,
                    body.raffleId,
                    body.quantity
                );

                const result = await this.prismaService.$transaction(async (prisma) => {
                    const availableCount = await prisma.availableTicket.count({
                        where: {
                            raffleId: body.raffleId,
                            ticketNumber: { in: generatedNumbers },
                            isReserved: false,
                            isPurchased: false
                        }
                    });

                    if (availableCount !== generatedNumbers.length) {
                        throw new Error('Alguns tickets selecionados já não estão mais disponíveis');
                    }

                    await prisma.availableTicket.updateMany({
                        where: {
                            raffleId: body.raffleId,
                            ticketNumber: { in: generatedNumbers },
                            isReserved: false,
                            isPurchased: false
                        },
                        data: {
                            isReserved: true,
                        },
                    });

                    const paymentResponse = await payment.create({
                        body: {
                            transaction_amount: priceTotal,
                            description: raffle.description,
                            payment_method_id: "pix",
                            notification_url: "https://tecnewsbr.com.br/notification",
                            payer: {
                                email: body.email,
                            },
                            date_of_expiration: expirationDate.toISOString(),
                        },
                        requestOptions: { idempotencyKey: uniqueIdempotencyKey },
                    });

                    const pixUrl = paymentResponse.point_of_interaction.transaction_data.ticket_url;
                    const qrCode = paymentResponse.point_of_interaction.transaction_data.qr_code_base64;
                    const pixKey = paymentResponse.point_of_interaction.transaction_data.qr_code;

                    const newPayment = await this.prismaService.payment.create({
                        data: {
                            transactionId: String(paymentResponse.id),
                            amount: priceTotal,
                            paymentMethod: 'pix',
                            qrCode,
                            pixKey,
                            status: 'pending',
                            payerEmail: body.email,
                            ticketNumbers: generatedNumbers,
                            pixUrl,
                            user: {
                                connect: { id: body.userId }
                            },
                            raffle: {
                                connect: { id: body.raffleId }
                            }
                        },
                    });

                    return { paymentDetails: newPayment, generatedNumbers };
                });

                return result;
            } catch (error) {
                if (generatedNumbers) {
                    await this.prismaService.$transaction(async (prisma) => {
                        await prisma.availableTicket.updateMany({
                            where: {
                                raffleId: body.raffleId,
                                ticketNumber: { in: generatedNumbers }
                            },
                            data: {
                                isReserved: false,
                                reservedUntil: null
                            },
                        });
                    });
                }
            }
        });
    }

    async handlePaymentApproved(paymentId: string) {
        try {
            await this.prismaService.$transaction(async (prisma) => {
                const payment = await prisma.payment.findUnique({
                    where: { id: paymentId },
                    select: {
                        id: true,
                        userId: true,
                        raffleId: true,
                        ticketNumbers: true,
                    }
                });

                if (!payment) {
                    throw new BadRequestException('Payment not found.');
                }

                const existingTicket = await prisma.ticket.findFirst({
                    where: {
                        userId: payment.userId,
                        raffleId: payment.raffleId,
                        number: {
                            equals: payment.ticketNumbers
                        }
                    }
                });

                if (!existingTicket) {
                    await prisma.ticket.create({
                        data: {
                            userId: payment.userId,
                            raffleId: payment.raffleId,
                            number: payment.ticketNumbers,
                        },
                    });

                    await prisma.availableTicket.updateMany({
                        where: {
                            raffleId: payment.raffleId,
                            ticketNumber: { in: payment.ticketNumbers }
                        },
                        data: {
                            isPurchased: true,
                            isReserved: true,
                            reservedUntil: null
                        },
                    });
                }

                await prisma.payment.update({
                    where: { id: paymentId },
                    data: { status: 'approved' }
                });
            });
        } catch (error) {
            console.error('Error handling payment approval:', error);
            throw new Error('Failed to process payment approval.');
        }
    }

    async getByIdTicket(userId: string) {
        const tickets = await this.prismaService.ticket.findMany({
            where: { userId },
            select: {
                number: true,
                raffleId: true,
            },
        });
        console.log(tickets);
        return tickets;
    }

}