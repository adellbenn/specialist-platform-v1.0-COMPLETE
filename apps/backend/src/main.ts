try {
  // Only load tracing in production when OTLP collector is expected to be available
  if (process.env.NODE_ENV === 'production') {
    require('./tracing');
  }
} catch {
  // OTel is optional — skip if not available
}
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const winstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(winstonLogger);

  // الأمان — CSP stricter for production
  const isProd = config.get('app.nodeEnv') === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          ...(isProd ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

  // CORS
  const allowedOrigins = config.get<string[]>('app.corsOrigins') || ['http://localhost:3000'];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // إيقاف نظيف عند استقبال إشارات الإيقاف (docker stop, SIGTERM)
  app.enableShutdownHooks();

  // Validation pipe عالمي
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // حذف الحقول غير الموجودة في الـ DTO
      forbidNonWhitelisted: false,
      transform: true, // تحويل الأنواع تلقائياً
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // تفعيل class-transformer (@Exclude)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger Documentation
  if (config.get('app.nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('منصة إدارة أدوار الأخصائيين')
      .setDescription('API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get<number>('app.port') ?? 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   🏥 منصة إدارة أدوار الأخصائيين               ║
  ║   🚀 Server: http://localhost:${port}              ║
  ║   📚 Docs:   http://localhost:${port}/api/docs    ║
  ╚══════════════════════════════════════════════════╝
  `);
}

bootstrap();
