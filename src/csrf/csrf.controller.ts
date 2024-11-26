import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req, @Res() res): void {
    const token = req.csrfToken();

    res.cookie('XSRF-TOKEN', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.set('X-CSRF-TOKEN', token);

    res.json({
      token,
      success: true
    });
  }
}