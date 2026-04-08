import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const logger = new Logger('Bootstrap');

  // Prefijo global
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: [
      'https://erp.edatia.com',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validación de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Filtro global de excepciones
  app.useGlobalFilters(new AllExceptionsFilter());

  // Interceptor de logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Edatia ERP API')
    .setDescription('API REST para el sistema ERP SaaS de Edatia')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('https://api.edatia.com', 'Producción')
    .addServer('http://localhost:4000', 'Desarrollo local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  logger.log(`🚀 API corriendo en: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger docs:      http://localhost:${port}/api/docs`);
}

bootstrap();
