import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Validates the Origin header on state-changing requests.
 * Since this API uses JWT Bearer tokens (not cookies), CSRF via browser
 * form submissions is already prevented. This adds server-side enforcement
 * as defense-in-depth.
 * Requests without an Origin header (curl, server-to-server) are allowed.
 */
@Injectable()
export class OriginMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) return next();

    const origin = req.headers['origin'];
    if (!origin) return next(); // server-to-server / CLI tools

    // Support comma-separated CORS_ORIGINS for multi-domain setups (e.g. domain migration)
    const extraOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : [];
    const allowedOrigins = new Set([
      process.env.FRONTEND_URL || 'http://localhost:4200',
      process.env.ADMIN_URL    || 'http://localhost:4201',
      ...extraOrigins,
    ]);
    if (!allowedOrigins.has(origin)) {
      throw new ForbiddenException('Request origin not allowed');
    }

    next();
  }
}
