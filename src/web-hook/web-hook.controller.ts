import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { Public } from '../lib/public.decorator';
import { PaymentService } from '../payment/payment.service';

@Controller('notification')
export class WebhookController {
    constructor(
        private readonly paymentService: PaymentService,
    ) { }

    @Public()
    @Post()
    async handleWebhook(@Body() body: any, @Headers() headers: any) {
        try {
            const paymentId = body.data?.id;

            if (!paymentId) {
                throw new BadRequestException('Payment ID not found');
            }


            const config = {
                method: 'GET',
                url: `https://api.mercadopago.com/v1/payments/${paymentId}`,
                headers: {
                    'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
                }
            };

            const paymentStatus = await this.paymentService.fetchPaymentStatus(paymentId, config);

            return {
                message: 'Webhook processed successfully',
                status: paymentStatus
            };
        } catch (error) {
            console.error('Webhook processing error:', error);
            throw new BadRequestException('Webhook processing failed');
        }
    }

}