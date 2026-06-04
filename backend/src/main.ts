// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcrypt';

async function autoSeed(prisma: PrismaService) {
  const adminCount = await prisma.admin.count();
  if (adminCount > 0) return; // already seeded

  console.log('🌱 Auto-seeding production database...');

  const passwordHash = await bcrypt.hash('Admin@123456', 12);
  await prisma.admin.create({
    data: { email: 'admin@agnisiragu.com', passwordHash, name: 'Super Admin', adminRole: 'SUPER_ADMIN' },
  });

  const categories = [
    { nameTa: 'அரசியல்', nameEn: 'Politics', slug: 'politics', displayOrder: 1 },
    { nameTa: 'விளையாட்டு', nameEn: 'Sports', slug: 'sports', displayOrder: 2 },
    { nameTa: 'சினிமா', nameEn: 'Cinema', slug: 'cinema', displayOrder: 3 },
    { nameTa: 'குற்றம்', nameEn: 'Crime', slug: 'crime', displayOrder: 4 },
    { nameTa: 'தொழில்நுட்பம்', nameEn: 'Technology', slug: 'technology', displayOrder: 5 },
    { nameTa: 'வணிகம்', nameEn: 'Business', slug: 'business', displayOrder: 6 },
    { nameTa: 'உள்ளூர்', nameEn: 'Local', slug: 'local', displayOrder: 7 },
    { nameTa: 'சர்வதேசம்', nameEn: 'International', slug: 'international', displayOrder: 8 },
    { nameTa: 'பொழுதுபோக்கு', nameEn: 'Entertainment', slug: 'entertainment', displayOrder: 9 },
    { nameTa: 'சுகாதாரம்', nameEn: 'Health', slug: 'health', displayOrder: 10 },
    { nameTa: 'கல்வி', nameEn: 'Education', slug: 'education', displayOrder: 11 },
    { nameTa: 'சமூகம்', nameEn: 'Society', slug: 'society', displayOrder: 12 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: { ...cat, isActive: true } });
  }

  console.log('✅ Auto-seed complete. Admin: admin@agnisiragu.com / Admin@123456');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', '*'),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger (only in non-production)
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Agnisiragu API')
      .setDescription('Agnisiragu News Platform REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Auto-seed on first deploy
  const prisma = app.get(PrismaService);
  await autoSeed(prisma);

  await app.listen(port);
  console.log(`Agnisiragu backend running on port ${port}`);
}

bootstrap();
