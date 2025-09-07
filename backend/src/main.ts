import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Support both Docker and dev server
    credentials: true,
  });

  // Disable validation pipe completely for testing
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true, // important for nested DTOs
  //   }),
  // );

  await app.listen(process.env.PORT ?? 3001); // Use port 3001 as configured in docker-compose
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3001}`,
  );
  console.log(
    `GraphQL Playground: http://localhost:${process.env.PORT ?? 3001}/graphql`,
  );
}
bootstrap();
