import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { UserRepo } from './repos/index.js';

const repos = [UserRepo];

@Global()
@Module({
  providers: [PrismaService, ...repos],
  exports: [PrismaService, ...repos],
})
export class DatabaseModule {}
