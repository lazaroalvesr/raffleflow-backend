import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as csrf from 'csurf';
import * as cookieParser from 'cookie-parser'; // Import cookie-parser

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection: any;
  private publicRoutes: string[];

  constructor() {
    this.publicRoutes = process.env.PUBLIC_ROUTES
      ? process.env.PUBLIC_ROUTES.split(',')
      : [
          '/auth/create',
          '/auth/login',
          '/raffle/getAll',
          '/raffle/getById',
        ];

    this.csrfProtection = csrf({
      cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000, // Token válido por 1 hora
      },
      value: (req) =>
        req.headers['x-csrf-token'] ||
        req.cookies['XSRF-TOKEN'] ||
        req.body['_csrf'],
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Certifique-se de que o cookie-parser está sendo usado antes de csrf
    cookieParser()(req, res, () => {});

    // Rotas públicas ignoram CSRF
    if (this.isPublicRoute(req.path)) {
      return next();
    }

    // Método para gerar token em rotas específicas
    if (req.path === '/csrf-token') {
      return this.generateCsrfToken(req, res);
    }

    // Proteção CSRF para rotas protegidas
    this.csrfProtection(req, res, (err) => {
      if (err) {
        console.error('CSRF Error:', err);
        return res.status(403).json({
          statusCode: 403,
          message: 'CSRF token inválido',
          error: 'Forbidden',
        });
      }
      next();
    });
  }

  // Verifica se a rota é pública
  private isPublicRoute(path: string): boolean {
    return this.publicRoutes.some((route) => path.startsWith(route));
  }

  // Gera token CSRF sob demanda
  private generateCsrfToken(req: Request, res: Response) {
    // O token CSRF estará disponível após a execução do middleware
    const csrfToken = req.csrfToken();
    
    // Define cookie com token para frontend
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Acessível por JS
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.json({ csrfToken });
  }
}
