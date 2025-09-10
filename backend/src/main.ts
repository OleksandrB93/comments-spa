import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          imgSrc: [
            `'self'`,
            'data:',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          scriptSrc: [`'self'`, `'unsafe-inline'`, 'https:'],
          manifestSrc: [
            `'self'`,
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );

  // Enable CORS for frontend
  app.enableCors({
    origin: (origin, callback) => {
      // Дозволяємо запити без origin (наприклад, мобільні додатки, Postman)
      if (!origin) return callback(null, true);

      // Список дозволених доменів
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:3001',
        // Додаємо підтримку для будь-якого домену в production
        ...(process.env.NODE_ENV === 'production' ? ['*'] : []),
      ];

      // Якщо це production, дозволяємо всі домени
      if (process.env.NODE_ENV === 'production') {
        return callback(null, true);
      }

      // В development режимі перевіряємо список дозволених доменів
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //   }),
  // );

  await app.listen(process.env.PORT ?? 3001); // Use port 3001 as configured in docker-compose
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3001}`,
  );
  console.log(
    `GraphQL Playground: http://localhost:${process.env.PORT ?? 3001}/graphql`,
  );
  console.log(`WebSocket Gateway: ws://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
