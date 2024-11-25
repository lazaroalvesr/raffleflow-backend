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
     { path: '/csrf/token', method: 'GET' }, // Adiciona rota de token CSRF
   ];

   constructor() {
     this.csrfProtection = csrf({
       cookie: {
         httpOnly: true,
         secure: true,
         sameSite: 'strict',
       },
       // Adiciona estas configurações para mais flexibilidade
       value: (req) => req.headers['x-csrf-token'] || req.cookies['XSRF-TOKEN']
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
     // Log para depuração
     console.log(`CSRF Middleware - Route: ${req.originalUrl}, Method: ${req.method}`);

     if (this.isPublicRoute(req)) {
       console.log('Public route, skipping CSRF protection');
       return next();
     }

     cookieParser()(req, res, () => {
       this.csrfProtection(req, res, (err) => {
         if (err) {
           console.error('CSRF Error:', err);
           return res.status(403).json({
             message: 'CSRF token missing or invalid',
             details: err.message
           });
         }

         // Sempre gera um novo token para rotas protegidas
         const csrfToken = req.csrfToken();
         
         // Log do token gerado
         console.log('Generated CSRF Token:', csrfToken);

         // Define o cookie com path mais específico
         if (!req.cookies['XSRF-TOKEN']) {
           res.cookie('XSRF-TOKEN', csrfToken, {
             httpOnly: true,
             secure: true,
             sameSite: 'strict',
             path: '/', // Importante: define para todo o domínio
             maxAge: 24 * 60 * 60 * 1000 // 24 horas de validade
           });
         }

         // Adiciona o token aos headers da resposta para facilitar no front-end
         res.set('X-CSRF-TOKEN', csrfToken);

         next();
       });
     });
   };
}