import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req, @Res() res): void {
    try {
      // Verifique se req.csrfToken existe antes de chamar
      const token = req.csrfToken ? req.csrfToken() : null;

      if (!token) {
        return res.status(500).json({
          message: 'CSRF token generation failed',
          success: false,
        });
      }

      // Defina o token nos cabeçalhos
      res.set('X-CSRF-TOKEN', token);

      // Envie o token na resposta
      res.json({
        token,
        success: true,
      });
    } catch (error) {
      console.error('CSRF Token Error:', error);
      res.status(500).json({
        message: 'Error generating CSRF token',
        success: false,
      });
    }
  }
}