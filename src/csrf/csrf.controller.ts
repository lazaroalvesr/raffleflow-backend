import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req, @Res() res) {
    // O middleware já cuida da geração do token
    res.json({ message: 'Token disponível' });
  }
}