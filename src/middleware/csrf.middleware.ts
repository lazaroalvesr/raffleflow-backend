import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import csrf from 'csrf'; // Note: This is different from csurf

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private csrfProtection: any;
  private publicRoutes: string[];
  private csrfTokens: csrf;

  constructor() {
    this.csrfTokens = new csrf();
    this.publicRoutes = process.env.PUBLIC_ROUTES
      ? process.env.PUBLIC_ROUTES.split(',')
      : [
        '/auth/create',
        '/auth/login',
        '/raffle/getAll',
        '/raffle/getById',
      ];

    this.csrfProtection = (req: Request, res: Response, next: NextFunction) => {
      const secret = req.cookies['XSRF-SECRET'] || this.csrfTokens.secretSync();
      res.cookie('XSRF-SECRET', secret, {
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      const token = req.headers['x-csrf-token']
        || req.cookies['XSRF-TOKEN']
        || req.body['_csrf'];

      if (!token || !this.csrfTokens.verify(secret, token)) {
        return res.status(403).json({
          statusCode: 403,
          message: 'CSRF token inválido',
          error: 'Forbidden',
        });
      }

      next();
    };
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (this.isPublicRoute(req.path)) {
      return next();
    }

    if (req.path === '/csrf-token') {
      return this.generateCsrfToken(req, res);
    }

    this.csrfProtection(req, res, next);
  }

  private isPublicRoute(path: string): boolean {
    return this.publicRoutes.some((route) => path.startsWith(route));
  }

  private generateCsrfToken(req: Request, res: Response) {
    const secret = req.cookies['XSRF-SECRET'] || this.csrfTokens.secretSync();
    const token = this.csrfTokens.create(secret);

    res.cookie('XSRF-SECRET', secret, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.json({ csrfToken: token });
  }
}