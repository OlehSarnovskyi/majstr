import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class MastersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: { city?: string; search?: string }) {
    const where: Prisma.UserWhereInput = {
      role: Role.MASTER,
      services: { some: {} },
    };

    if (filters?.city) {
      where.city = { equals: filters.city, mode: 'insensitive' };
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName:  { contains: filters.search, mode: 'insensitive' } },
        { services: { some: { name: { contains: filters.search, mode: 'insensitive' } } } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        city: true,
        _count: { select: { services: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll_cities() {
    const masters = await this.prisma.user.findMany({
      where: { role: Role.MASTER, services: { some: {} }, city: { not: null } },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return masters.map((m) => m.city).filter(Boolean) as string[];
  }

  async findOne(id: string) {
    const master = await this.prisma.user.findUnique({
      where: { id, role: Role.MASTER },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        city: true,
        createdAt: true,
        workingHours: true,
        services: {
          include: { category: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!master) {
      throw new NotFoundException('Master not found');
    }

    return master;
  }
}
