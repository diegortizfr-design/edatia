import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const logger = new Logger('Bootstrap');
  const isProd = process.env.NODE_ENV === 'production';

  // Prefijo global
  app.setGlobalPrefix('api/v1');

  // ── Cookie parser (necesario para leer httpOnly cookies en refresh/logout) ──
  app.use(cookieParser());

  // ── Seguridad: headers HTTP ────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc:   ["'self'", "'unsafe-inline'"],
          scriptSrc:  ["'self'"],
          imgSrc:     ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // necesario para Swagger en desarrollo
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: isProd
      ? ['https://erp.edatia.com', 'https://manager.edatia.com']
      : ['https://erp.edatia.com', 'https://manager.edatia.com',
         'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ── Validación de DTOs ─────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:              true,
      forbidNonWhitelisted:   true,
      transform:              true,
      transformOptions:       { enableImplicitConversion: true },
    }),
  );

  // ── Filtro global de excepciones ──────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Interceptor de logging ─────────────────────────────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── Swagger — solo disponible fuera de producción ─────────────────────────
  if (!isProd) {
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

    logger.log(`📚 Swagger docs: http://localhost:${process.env.PORT ?? 4000}/api/docs`);
  } else {
    logger.warn('📵 Swagger deshabilitado en producción');
  }

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  logger.log(`🚀 API corriendo en: http://localhost:${port}/api/v1`);
  logger.log(`🌍 Entorno: ${isProd ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
}

bootstrap();
