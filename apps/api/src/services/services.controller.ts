import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@SkipThrottle()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('masterId') masterId?: string
  ) {
    return this.servicesService.findAll({ categoryId, masterId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MASTER)
  create(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateServiceDto
  ) {
    return this.servicesService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MASTER)
  update(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto
  ) {
    return this.servicesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MASTER)
  remove(
    @Request() req: { user: { id: string } },
    @Param('id') id: string
  ) {
    return this.servicesService.remove(id, req.user.id);
  }
}
