import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module.js';
import { CustomLoggerService } from './common/logging/index.js';

async function bootstrap() {
  // Create custom logger for bootstrap and NestJS internal logging
  const logger = new CustomLoggerService('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger, // Use custom logger for all NestJS internal logging
  });

  const port = process.env.PORT || 3000;
  const apiPrefix = 'api/v1';

  app.setGlobalPrefix(apiPrefix);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // OpenAPI/Swagger configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Monorepo Starter API')
    .setDescription('NestJS + Prisma + PostgreSQL API')
    .setVersion('1.0')
    .addTag('Health', 'Health check endpoints')
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);

  // Serve OpenAPI JSON at /api/openapi-json
  SwaggerModule.setup('api/openapi', app, openApiDocument);

  // Scalar API Reference - modern API documentation UI
  app.use(
    '/api/reference',
    apiReference({
      theme: 'default',
      url: '/api/openapi-json',
    }),
  );

  await app.listen(port);

  logger.log(`Application started on http://localhost:${port}/${apiPrefix}`);
  logger.log(`API Reference at http://localhost:${port}/api/reference`);
}

bootstrap();
