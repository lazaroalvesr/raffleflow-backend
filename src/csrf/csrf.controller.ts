import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req, @Res() res): void {
    // Generate CSRF token
    const token = req.csrfToken();

    // Set the CSRF token as a cookie
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: true, // Makes the cookie accessible only through HTTP requests
      secure: process.env.NODE_ENV === 'production', // Secure cookie only in production
      sameSite: 'strict', // Prevents cross-site requests from being sent with this cookie
      path: '/', // The cookie is available across the entire domain
    });

    // Set the CSRF token in the response headers for front-end access
    res.set('X-CSRF-TOKEN', token);

    // Send the token as part of the response body
    res.json({
      token,
      success: true,
    });
  }
}
