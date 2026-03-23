import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './infrastructure/http/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Enable CORS if needed (usually done at API Gateway level in this architecture)
  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Tenant Service is running on: http://localhost:${port}`);
}

bootstrap();
