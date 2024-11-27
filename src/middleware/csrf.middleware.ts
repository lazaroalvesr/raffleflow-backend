import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express'; // ou 'fastify' se estiver usando Fastify
import csrf from 'csrf';
import * as cookieParser from 'cookie-parser';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfTokens: csrf;

  constructor() {
    this.csrfTokens = new csrf();
  }

  use(req: Request, res: Response, next: NextFunction) {
    cookieParser()(req, res, () => {});

    const secret = req.cookies['XSRF-SECRET'] || this.csrfTokens.secretSync();
    res.cookie('XSRF-SECRET', secret, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    const token = req.headers['x-csrf-token'] || req.cookies['XSRF-TOKEN'] || req.body['_csrf'];

    if (req.path !== '/csrf-token' && !this.csrfTokens.verify(secret, token)) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Invalid CSRF token',
        error: 'Forbidden',
      });
    }

    next();
  }
}
