import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req, @Res() res) {
    // Gera e retorna o token
    const csrfToken = req.csrfToken();
    
    // Opcional: define cookie com o token
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Acessível por JS
      sameSite: 'strict'
    });

    res.json({ csrfToken });
  }
}