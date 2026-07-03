import { ConflictException, Injectable } from '@nestjs/common';

import type { UserResponse } from '@starter/shared';

import type { User } from '../../database/index.js';
import { UserRepo } from '../../database/index.js';
import { CreateUserDto } from './dto/index.js';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepo) {}

  async list(): Promise<UserResponse[]> {
    const users = await this.userRepo.findMany();
    return users.map((user) => this.toResponse(user));
  }

  async create(dto: CreateUserDto): Promise<UserResponse> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = await this.userRepo.create({ email: dto.email, name: dto.name ?? null });
    return this.toResponse(user);
  }

  private toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
