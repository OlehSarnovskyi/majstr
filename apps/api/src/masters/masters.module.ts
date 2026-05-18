import { Module } from '@nestjs/common';
import { MastersService } from './masters.service';
import { MastersController } from './masters.controller';
import { ReviewsModule } from '../reviews/reviews.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ReviewsModule, EmailModule],
  controllers: [MastersController],
  providers: [MastersService],
  exports: [MastersService],
})
export class MastersModule {}
