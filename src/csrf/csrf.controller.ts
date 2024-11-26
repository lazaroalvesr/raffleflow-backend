import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req, @Res() res) {
    // Adicione esta verificação para garantir que o método existe
    if (typeof req.csrfToken === 'function') {
      const token = req.csrfToken();
      
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false, // Permite que o front-end leia
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return {
        token,
        success: true
      };
    } else {
      console.error('CSRF Token method not available');
      res.status(500).json({
        message: 'CSRF token generation failed',
        success: false
      });
    }
  }
}