import { Controller, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
    constructor(private paymentService: PaymentService) { }

    @Get("getById/:userId")
    async getByUserId(@Param("userId") userId: string) {
        return await this.paymentService.getById(userId)
    }

    @Get("getPaymentInfoAll")
    async getPaymentInfo() {
        return await this.paymentService.getAllPaymentInfoAll()
    }
}
