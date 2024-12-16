import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateRaffleDTO } from '../dto/raffle/CreateDTO';
import { PrismaService } from '../prisma/prisma.service';
import { supabase } from '../supabaseClient';
import * as crypto from 'node:crypto'

@Injectable()
export class RaffleService {
    constructor(private readonly prismaService: PrismaService) { }

    async createRaffle(body: CreateRaffleDTO, image: Express.Multer.File) {
        const imageUrl = await this.uploadImage(image);

        if (!imageUrl) {
            throw new BadRequestException('Failed to upload image.');
        }

        return this.prismaService.$transaction(async (prisma) => {
            const raffle = await prisma.raffle.create({
                data: {
                    name: body.name,
                    description: body.description,
                    startDate: body.startDate,
                    endDate: body.endDate,
                    quantityNumbers: body.quantityNumbers,
                    ticketPrice: body.ticketPrice,
                    image: imageUrl,
                    userId: body.userId,
                },
            });

            const totalTickets = parseInt(body.quantityNumbers, 10);
            if (isNaN(totalTickets) || totalTickets <= 0) {
                throw new BadRequestException('Invalid quantity of tickets.');
            }

            const batchSize = 100;
            const availableTickets = [];

            for (let i = 1; i <= totalTickets; i++) {
                availableTickets.push({
                    raffleId: raffle.id,
                    ticketNumber: i,
                });

                if (availableTickets.length === batchSize || i === totalTickets) {
                    await prisma.availableTicket.createMany({
                        data: availableTickets,
                        skipDuplicates: true,
                    });
                    availableTickets.length = 0;
                }
            }

            return raffle;
        });
    }

    private async uploadImage(profileImage: Express.Multer.File): Promise<string | null> {
        const uniqueFileName = `raffle${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('raffle-img')
            .upload(`raffle/${uniqueFileName}`, profileImage.buffer, {
                contentType: profileImage.mimetype,
                upsert: false,
            });

        if (uploadError) {
            console.error(uploadError);
            return null;
        }

        const { data } = supabase
            .storage
            .from('raffle-img')
            .getPublicUrl(`raffle/${uniqueFileName}`);

        return data.publicUrl;
    }

    async getAll() {
        return await this.prismaService.raffle.findMany();
    }

    async getById(id: string) {
        const raffle = await this.prismaService.raffle.findFirst({
            where: { id },
            select: {
                name: true,
                description: true,
                ticketPrice: true,
                image: true,
                quantityNumbers: true,
                endDate: true,
                winnerTicketId: true,
                winnerTicket: {
                    select: {
                        number: true,
                        user: {
                            select: {
                                name: true,
                                email: true,
                                telephone: true
                            }
                        }
                    }

                },
                AvailableTicket: {
                    where: {
                        isReserved: false,
                        isPurchased: false,
                    },
                },
            },
        });

        if (!raffle) {
            throw new Error('Raffle not found');
        }

        return {
            raffle,
            availableTickets: raffle.AvailableTicket.length,
        };
    }


    async getInfoPaymentRaffle(id: string) {
        const raffleInfo = await this.prismaService.raffle.findFirst({
            where: { id },
            select: {
                name: true,
                Payment: {
                    select: {
                        user: {
                            select: {
                                name: true,
                            },
                        },
                        status: true,
                        createdAt: true,
                        ticketNumbers: true,
                        amount: true,
                    },
                },
            },
        });

        const paymentInfo = raffleInfo?.Payment.map((payment) => ({
            name: raffleInfo.name,
            user: payment.user,
            status: payment.status,
            createdAt: payment.createdAt,
            ticketNumbersCount: payment.ticketNumbers.length,
            amount: payment.amount,
        }));

        return paymentInfo;
    }

    async getRaffleByUserId(userId: string) {
        const raffles = await this.prismaService.raffle.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                endDate: true,
                quantityNumbers: true,
                winnerTicketId: true,
                ticketPrice: true,
                AvailableTicket: {
                    where: {
                        isReserved: false,
                        isPurchased: false,
                    },
                },
            },
        });

        const result = raffles.map((raffle) => ({
            id: raffle.id,
            name: raffle.name,
            endDate: raffle.endDate,
            ticketPrice: raffle.ticketPrice,
            winnerTicketId: raffle.winnerTicketId,
            availableTickets: raffle.AvailableTicket.length || 0,
            quantityNumbers: raffle.quantityNumbers
        }));

        return result;
    }

    async drawWinner(raffleId: string) {
        // Additional logging or monitoring could be added here
        const raffle = await this.prismaService.raffle.findUnique({
            where: { id: raffleId },
            include: { tickets: true },
        });

        if (!raffle) {
            throw new NotFoundException('Sorteio não encontrado.');
        }

        const purchasedTickets = raffle.tickets;

        if (purchasedTickets.length === 0) {
            throw new BadRequestException('Nenhum bilhete comprado para este sorteio.');
        }

        const winnerIndex = crypto.randomInt(0, purchasedTickets.length);
        const winnerTicket = purchasedTickets[winnerIndex];

        const winnerUser = await this.prismaService.user.findUnique({
            where: { id: winnerTicket.userId },
            select: {
                name: true,
                email: true,
                telephone: true
            }
        });

        if (!winnerUser) {
            throw new NotFoundException('Usuário não encontrado.');
        }

        const drawDate = new Date();
        await this.prismaService.raffle.update({
            where: { id: raffleId },
            data: {
                winnerTicketId: winnerTicket.id,
                drawDate: drawDate
            },
        });

        return {
            winnerTicket,
            user: winnerUser,
            drawDate
        };
    }

    async updateRaffle(id: string, image: Express.Multer.File, updateRaffle: {
        name?: string,
        description?: string,
        endDate?: Date,
        quantityNumbers: string,
        ticketPrice: string
    }) {
        let imageUrl = undefined;

        if (image) {
            try {
                imageUrl = await this.uploadImage(image);
            } catch (error) {
                console.error('Error uploading image:', error);
                throw new Error('Image upload failed');
            }
        }

        const responseEdit = await this.prismaService.raffle.update({
            where: { id },
            data: {
                name: updateRaffle.name,
                description: updateRaffle.description,
                endDate: updateRaffle.endDate,
                image: imageUrl,
                quantityNumbers: updateRaffle.quantityNumbers,
                ticketPrice: updateRaffle.ticketPrice,
            }
        });

        return responseEdit;
    }

    async delete(id: string) {
        const raffle = await this.prismaService.raffle.findFirst({
            where: { id },
            select: {
                image: true,
            },
        });

        if (!raffle) {
            throw new BadRequestException('Raffle not found');
        }
        const payments = await this.prismaService.payment.findMany({
            where: { raffleId: id },
        });

        if (payments.length > 0) {
            await this.prismaService.payment.deleteMany({
                where: { raffleId: id },
            });
        } else {
            console.log(`No payments found for raffleId: ${id}`);
        }

        await this.prismaService.availableTicket.deleteMany({ where: { raffleId: id } });
        await this.prismaService.ticket.deleteMany({ where: { raffleId: id } });

        const response = await this.prismaService.raffle.delete({
            where: { id },
        });

        return response;
    }

}
