import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom throttler guard that reads the real client IP from the
 * X-Forwarded-For header set by reverse proxies (Vercel, Nginx, etc.).
 *
 * Without this, all requests arriving through the Vercel proxy share
 * the same throttle bucket (Vercel's egress IP), causing 429 errors
 * when multiple users browse the site simultaneously.
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwarded = req.headers?.['x-forwarded-for'];
    const realIp = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : null;
    return realIp || req.ip || 'unknown';
  }
}
