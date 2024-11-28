import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { RaffleService } from './raffle.service';
import { CreateRaffleDTO } from '../dto/raffle/CreateDTO';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../lib/AdmGuard';
import { Public } from '../lib/public.decorator';

@Controller('raffle')
export class RaffleController {
    constructor(private readonly raffleService: RaffleService) { }

    @Post("create")
    @UseGuards(AdminGuard)
    @UseInterceptors(FileInterceptor('image'))
    async create(@Body() body: CreateRaffleDTO, @UploadedFile() image: Express.Multer.File) {
        return await this.raffleService.createRaffle(body, image);
    }

    @Public()
    @Get("getAll")
    async getAll() {
        return await this.raffleService.getAll()
    }

    @Public()
    @Get("getById/:id")
    async getById(@Param("id") id: string) {
        return await this.raffleService.getById(id)
    }

    @Get("getByUserId/:userId")
    @UseGuards(AdminGuard)
    async getByUserId(@Param("userId") userId: string) {
        return await this.raffleService.getByUserId(userId)
    }

    @Get("getInfoPaymentRaffle/:id")
    @UseGuards(AdminGuard)
    async getInfoPaymentRaffle(@Param("id") id: string) {
        return await this.raffleService.getInfoPaymentRaffle(id)
    }

    @Post('draw-winner/:id')
    async drawWinner(@Param('id') raffleId: string) {
        const winnerTicket = await this.raffleService.drawWinner(raffleId);
        return { message: 'Winner drawn successfully', winnerTicket };
    }
    
    @Patch("update/:id")
    @UseInterceptors(FileInterceptor('image')) 
    async updatedRaffle(
        @Param("id") id: string,
        @Body() updateRaffle: { 
            name?: string, 
            description?: string, 
            endDate?: Date, 
            quantityNumbers: string, 
            ticketPrice: string 
        },
        @UploadedFile() image: Express.Multer.File
    ) {
        return await this.raffleService.updateRaffle(id, image, updateRaffle); 
    }

    @Delete("delete/:id")
    async delete(@Param("id") id: string,) {
        return await this.raffleService.delete(id)
    }
}
