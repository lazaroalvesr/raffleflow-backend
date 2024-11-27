import { Controller, Get, Res, Req, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import CSRF from 'csrf';

const csrf = new CSRF();

@Controller('csrf')
export class CsrfController {
  private secret: string;

  constructor() {
    // Gera um segredo na inicialização
    this.secret = csrf.secretSync();
  }

  @Get('token')
  getCsrfToken(@Res() res: Response) {
    // Gera o token CSRF usando o segredo
    const token = csrf.create(this.secret);

    // Retorna o token para o cliente (ex.: via cookie ou cabeçalho)
    res.json({ csrfToken: token });
  }

  @Post('validate')
  validateCsrfToken(@Req() req: Request, @Body('csrfToken') csrfToken: string) {
    // Verifica o token CSRF
    const isValid = csrf.verify(this.secret, csrfToken);

    if (!isValid) {
      throw new HttpException('Invalid CSRF token', HttpStatus.FORBIDDEN);
    }

    return { message: 'CSRF token is valid!' };
  }
}
