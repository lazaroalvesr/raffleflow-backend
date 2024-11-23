import { Injectable, NestMiddleware } from '@nestjs/common';
import * as csrf from 'csurf';
import * as cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection: any;

  // Definindo rotas públicas que não necessitam de CSRF
  private publicRoutes = [
    { path: '/auth/create', method: 'POST' },
    { path: '/auth/login', method: 'POST' },
    { path: '/raffle/getAll', method: 'GET' },
    { path: '/raffle/getById', method: 'GET' },
  ];

  constructor() {
    this.csrfProtection = csrf({
      cookie: {
        httpOnly: false,  // O cookie pode ser acessado pelo JavaScript (para enviar o token CSRF)
        secure: true, // Só envia cookies em HTTPS em produção
        sameSite: 'none',  // Permite o envio de cookies em requisições cross-origin
        domain: '.tecnewsbr.com.br',  // O domínio que pode acessar o cookie
      },
    });
  }

  // Verifica se a rota é pública (não precisa de CSRF)
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

  // Middleware CSRF
  use = (req: Request, res: Response, next: NextFunction) => {
    // Se for uma rota pública, não aplica CSRF
    if (this.isPublicRoute(req)) {
      return next();
    }

    // Parse de cookies
    cookieParser()(req, res, () => {
      // Aplica a proteção CSRF
      this.csrfProtection(req, res, (err) => {
        if (err) {
          return res.status(403).json({
            message: 'CSRF token missing or invalid',
          });
        }

        // Gera e envia o token CSRF se ainda não estiver no cookie
        if (!req.cookies['XSRF-TOKEN']) {
          res.cookie('XSRF-TOKEN', req.csrfToken(), {
            httpOnly: false,  // O cookie pode ser acessado pelo JavaScript no frontend
            secure: true,  // Só envia cookies em HTTPS em produção
            sameSite: 'none',  // Permite o envio de cookies em requisições cross-origin
            domain: '.tecnewsbr.com.br',  // O domínio que pode acessar o cookie
          });
        }

        // Continua a execução do middleware
        next();
      });
    });
  };
}
