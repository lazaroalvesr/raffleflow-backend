import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import csrf from 'csrf';

@Controller('csrf')
export class CsrfController {
  private csrfTokens: csrf;

  constructor() {
    this.csrfTokens = new csrf();
  }

  @Get('token')
  getCsrfToken(@Res() res: Response) {
    const secret = this.csrfTokens.secretSync();
    const token = this.csrfTokens.create(secret);

    res.cookie('XSRF-SECRET', secret, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.json({ csrfToken: token });
  }
}
