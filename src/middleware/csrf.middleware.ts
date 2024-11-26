import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
   private publicRoutes = [
     { path: '/auth/create', method: 'POST' },
     { path: '/auth/login', method: 'POST' },
     { path: '/raffle/getAll', method: 'GET' },
     { path: '/raffle/getById', method: 'GET' },
   ];

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

   use(req: Request, res: Response, next: NextFunction) {
     // Log para depuração
     console.log(`CSRF Middleware - Route: ${req.originalUrl}, Method: ${req.method}`);

     if (this.isPublicRoute(req)) {
       console.log('Public route, skipping CSRF protection');
       return next();
     }

     next();
   }
}