import { Injectable, NestMiddleware } from '@nestjs/common';
import * as csrf from 'csurf';
import * as cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection: any;

  private publicRoutes = [
    { path: '/auth/create', method: 'POST' },
    { path: '/auth/login', method: 'POST' },
    { path: '/raffle/getAll', method: 'GET' },
    { path: '/raffle/getById', method: 'GET' },
  ];

  constructor() {
    this.csrfProtection = csrf({
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      },
      value: (req) => req.headers['x-csrf-token'] || req.cookies['XSRF-TOKEN'],
    });
  }

  private isPublicRoute(req: Request): boolean {
    if (
      this.publicRoutes.some(
        (route) =>
          req.originalUrl.startsWith(route.path) && req.method === route.method,
      )
    ) {
      return true;
    }

    const idRouteRegex = /^\/raffle\/getById\/[^\/]+$/;
    if (idRouteRegex.test(req.originalUrl) && req.method === 'GET') {
      return true;
    }

    return false;
  }

  use = (req: Request, res: Response, next: NextFunction) => {
    // Primeiro, aplique o cookie-parser
    cookieParser()(req, res, () => {
      // Verifique se é uma rota pública
      if (this.isPublicRoute(req)) {
        return next();
      }

      // Aplique a proteção CSRF
      this.csrfProtection(req, res, (err) => {
        if (err) {
          console.error('CSRF Error:', err);
          return res.status(403).json({
            message: 'CSRF token missing or invalid',
            details: err.message,
          });
        }

        // Gere um novo token
        try {
          const csrfToken = req.csrfToken ? req.csrfToken() : null;

          if (csrfToken) {
            // Defina o cookie XSRF-TOKEN se não existir
            if (!req.cookies['XSRF-TOKEN']) {
              res.cookie('XSRF-TOKEN', csrfToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                path: '/',
                maxAge: 24 * 60 * 60 * 1000, // 24 horas
              });
            }

            // Adicione o token aos cabeçalhos da resposta
            res.set('X-CSRF-TOKEN', csrfToken);
          }

          next();
        } catch (tokenError) {
          console.error('Token Generation Error:', tokenError);
          return res.status(500).json({
            message: 'Error generating CSRF token',
            details: tokenError.message,
          });
        }
      });
    });
  };
}