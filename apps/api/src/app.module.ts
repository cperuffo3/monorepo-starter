import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggingModule } from './common/logging/index.js';
import { CoreModule } from './core/index.js';
import { DatabaseModule } from './database/index.js';
import { HealthModule } from './integrations/health/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    LoggingModule,
    DatabaseModule,
    CoreModule,
    HealthModule,
  ],
})
export class AppModule {}
