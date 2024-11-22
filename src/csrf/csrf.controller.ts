import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() request: Request) {
    return { 
      token: request.csrfToken(), 
      success: true 
    };
  }
}