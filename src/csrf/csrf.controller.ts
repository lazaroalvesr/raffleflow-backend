import { Controller, Get, Req } from '@nestjs/common';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req): { token: string, success: boolean } { 
    const token = req.csrfToken(); 
    return { token, success: true }; 
  }
}