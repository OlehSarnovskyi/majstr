import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { ServicesModule } from '../services/services.module';
import { BookingsModule } from '../bookings/bookings.module';
import { MastersModule } from '../masters/masters.module';
import { OriginMiddleware } from '../common/middleware/origin.middleware';
import { EmailModule } from '../email/email.module';
import { SeedModule } from '../seed/seed.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000,   limit: 30  }, // 30 req/sec  — SPA may fire several requests at once
      { name: 'long',  ttl: 60000,  limit: 200 }, // 200 req/min — comfortable for active browsing
      { name: 'auth',  ttl: 900000, limit: 10  }, // 10 req/15min — overridden per auth endpoint
    ]),
    PrismaModule,
    SeedModule,
    AuthModule,
    EmailModule,
    CategoriesModule,
    ServicesModule,
    BookingsModule,
    MastersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(OriginMiddleware)
      .exclude(
        { path: 'api/auth/google/callback', method: RequestMethod.GET }, // Google redirects back
      )
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
