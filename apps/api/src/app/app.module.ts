import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from '../common/guards/throttler.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { ServicesModule } from '../services/services.module';
import { BookingsModule } from '../bookings/bookings.module';
import { MastersModule } from '../masters/masters.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { AdminModule } from '../admin/admin.module';
import { OriginMiddleware } from '../common/middleware/origin.middleware';
import { EmailModule } from '../email/email.module';
import { SeedModule } from '../seed/seed.module';
import { DevController } from '../dev/dev.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      // Only auth endpoints are throttled — all browsing endpoints use @SkipThrottle().
      // This single bucket is the global fallback; auth routes override it with stricter limits.
      { name: 'auth', ttl: 900000, limit: 50 }, // 50 req/15min fallback
    ]),
    PrismaModule,
    SeedModule,
    AuthModule,
    EmailModule,
    CategoriesModule,
    ServicesModule,
    BookingsModule,
    MastersModule,
    ReviewsModule,
    AdminModule,
  ],
  controllers: [AppController, DevController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
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
