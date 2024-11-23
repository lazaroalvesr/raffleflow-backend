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
        httpOnly: false,
        secure: true,
        sameSite: 'none',
      },
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
    if (this.isPublicRoute(req)) {
      return next();
    }

    cookieParser()(req, res, () => {
      this.csrfProtection(req, res, (err) => {
        if (err) {
          return res.status(403).json({
            message: 'CSRF token missing or invalid',
          });
        }

        if (!req.cookies['XSRF-TOKEN']) {
          res.cookie('XSRF-TOKEN', req.csrfToken(), {
            httpOnly: false,
            secure: true,
            sameSite: 'none',
          });
        }
        next();
      });
    });
  };
}
