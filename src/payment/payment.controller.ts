import { Controller, Get, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
    constructor(private paymentService: PaymentService) { }

    @Get("getById/:userId")
    async getAll(@Param("userId") userId: string) {
        return await this.paymentService.getById(userId)
    }

}
