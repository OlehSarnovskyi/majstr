import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(masterId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        ...dto,
        price: dto.price,
        durationMinutes: dto.durationMinutes ?? 120,
        masterId,
      },
      include: { category: true },
    });
  }

  async findAll(filters?: { categoryId?: string; masterId?: string }) {
    return this.prisma.service.findMany({
      where: {
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.masterId && { masterId: filters.masterId }),
      },
      include: {
        category: true,
        master: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        master: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            workingHours: true,
            timezone: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(id: string, masterId: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.masterId !== masterId) {
      throw new ForbiddenException('You can only update your own services');
    }

    return this.prisma.service.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string, masterId: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.masterId !== masterId) {
      throw new ForbiddenException('You can only delete your own services');
    }

    const activeBookings = await this.prisma.booking.count({
      where: {
        serviceId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (activeBookings > 0) {
      throw new ConflictException(
        'Cannot delete a service that has active bookings. Cancel or complete them first.'
      );
    }

    await this.prisma.service.delete({ where: { id } });
    return { message: 'Service deleted' };
  }
}
