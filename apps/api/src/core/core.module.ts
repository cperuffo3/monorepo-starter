import { Module } from '@nestjs/common';
import { UserModule } from './user/index.js';

/**
 * Aggregates all domain modules. New domain modules are registered here
 * (the `pnpm gen module <name>` generator does this automatically).
 */
@Module({
  imports: [UserModule],
})
export class CoreModule {}
