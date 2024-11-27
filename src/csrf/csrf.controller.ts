import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req, @Res() res) {
    // Gera e retorna o token CSRF
    const csrfToken = req.csrfToken();
    
    // Define o cookie com o token CSRF
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Acessível por JavaScript no frontend
      sameSite: 'strict', 
      secure: process.env.NODE_ENV === 'production', // Só ativa o `secure` em produção
    });

    // Retorna o token CSRF no corpo da resposta
    res.json({ csrfToken });
  }
}
