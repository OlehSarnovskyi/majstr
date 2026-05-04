import { Controller, Get, Param, Query } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { MastersService } from './masters.service';

@SkipThrottle()
@Controller('masters')
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  @Get()
  findAll(@Query('city') city?: string, @Query('search') search?: string) {
    return this.mastersService.findAll({ city, search });
  }

  @Get('cities')
  getCities() {
    return this.mastersService.findAll_cities();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mastersService.findOne(id);
  }
}
