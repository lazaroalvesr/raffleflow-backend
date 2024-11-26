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
    // Log for debugging
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
            details: err.message,
          });
        }

        // Always generate a new token for protected routes
        const csrfToken = req.csrfToken();

        // Log the generated token
        console.log('Generated CSRF Token:', csrfToken);

        // Set the cookie with a more specific path
        if (!req.cookies['XSRF-TOKEN']) {
          res.cookie('XSRF-TOKEN', csrfToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/', // Important: set for the entire domain
            maxAge: 24 * 60 * 60 * 1000, // 24 hours validity
          });
        }

        // Add the token to response headers for easy access on the front-end
        res.set('X-CSRF-TOKEN', csrfToken);

        next();
      });
    });
  };
}
