import { Controller, Get, Req } from '@nestjs/common';

@Controller('auth')
export class CsrfController {
  @Get('csrf-token')
  getCsrfToken(@Req() req) {
    return { csrfToken: req.csrfToken() };
  }
}