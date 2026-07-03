import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma.service.js';
import type { User } from '../../types.js';

@Injectable()
export class UserRepo {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findMany(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: { email: string; name?: string | null }): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
