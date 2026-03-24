import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { MessagingModule } from './infrastructure/messaging/messaging.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { JwksController } from './infrastructure/http/controllers/jwks.controller';
import { authProviders } from './auth.providers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    MessagingModule,
    SecurityModule,
  ],
  controllers: [AuthController, JwksController],
  providers: [...authProviders],
})
export class AppModule {}
