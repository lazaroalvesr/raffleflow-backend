import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csrf from 'csurf';
import * as cookieParser from 'cookie-parser';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection: any;

  constructor() {
    this.csrfProtection = csrf({
      cookie: true,
      value: (req) => req.headers['x-csrf-token'] || req.cookies['XSRF-TOKEN'],
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Aplique o cookie-parser primeiro
    cookieParser()(req, res, () => {
      // Verifique se é uma rota que deve ser ignorada
      const publicRoutes = [
        '/auth/create',
        '/auth/login',
        '/raffle/getAll',
        '/raffle/getById'
      ];

      if (publicRoutes.some(route => req.path.startsWith(route))) {
        return next();
      }

      // Aplique a proteção CSRF
      this.csrfProtection(req, res, (err) => {
        if (err) {
          console.error('CSRF Error:', err);
          return res.status(403).json({
            message: 'CSRF token invalid',
            error: err.message
          });
        }
        next();
      });
    });
  }
}