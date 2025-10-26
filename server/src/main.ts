import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as compression from 'compression';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Compression middleware
  app.use(compression());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://dcloudx.io',
      'https://app.dcloudx.io',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('D-CloudX API')
    .setDescription('Decentralized Cloud Resource Marketplace API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('resources', 'Resource management')
    .addTag('bookings', 'Booking management')
    .addTag('transactions', 'Transaction management')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('cloud', 'Cloud provider integration')
    .addTag('blockchain', 'Blockchain operations')
    .addTag('notifications', 'Notification system')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT') || 5000;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  await app.listen(port);

  logger.log(`🚀 D-CloudX API Server is running on port ${port}`);
  logger.log(`📚 API Documentation available at http://localhost:${port}/api/docs`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔗 API Base URL: http://localhost:${port}/api/v1`);
  
  if (nodeEnv === 'development') {
    logger.log(`🔧 Development mode enabled`);
    logger.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Error starting D-CloudX server:', error);
  process.exit(1);
});