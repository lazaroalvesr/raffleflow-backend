import { Controller, Get, Param, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AdminGuard } from 'src/lib/AdmGuard';
import { SearchUserPaymentDTO } from 'src/dto/payment/searchUserDTO';

@Controller('payment')
export class PaymentController {
    constructor(private paymentService: PaymentService) { }

    @Get("getById/:userId")
    async getByUserId(@Param("userId") userId: string) {
        return await this.paymentService.getById(userId)
    }

    @Get("getPaymentInfoAll")
    @UseGuards(AdminGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getPaymentInfo(@Query() filters: SearchUserPaymentDTO) {
        return await this.paymentService.getAllPaymentInfoAll(filters)
    }
}
