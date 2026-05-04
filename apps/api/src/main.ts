import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { execSync } from 'child_process';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from './app/app.module';

async function bootstrap() {
  // Run pending migrations before app starts (idempotent, safe on every deploy)
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (e) {
    Logger.error('Migration failed', e);
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // CSP disabled — Angular SPA requires 'unsafe-inline' for event handlers and
  // external font sources (Material Icons CDN), which defeats XSS protection.
  // Proper fix requires Angular nonce support (ngCspNonce) — future task.
  app.use(helmet({ contentSecurityPolicy: false }));

  // Cookie parser (needed for OAuth state verification)
  app.use(cookieParser());

  // CORS — frontend is on a separate origin (Vercel)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  app.enableCors({ origin: frontendUrl, credentials: true });

  // Serve uploaded files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/uploads',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const port = process.env.PORT || process.env.API_PORT || 3000;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
