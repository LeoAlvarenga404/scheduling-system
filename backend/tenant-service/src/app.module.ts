import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from './infrastructure/database/prisma/prisma.service';
import { PrismaTenantRepository } from './infrastructure/database/repositories/prisma-tenant.repository';
import { PrismaSubscriptionPlanRepository } from './infrastructure/database/repositories/prisma-subscription-plan.repository';
import { PrismaTenantSubscriptionRepository } from './infrastructure/database/repositories/prisma-tenant-subscription.repository';
import { PrismaTenantUsageService } from './infrastructure/database/services/prisma-tenant-usage.service';

import { RabbitMQPublisher } from './infrastructure/messaging/rabbitmq.publisher';
import { RabbitMQConsumer } from './infrastructure/messaging/rabbitmq.consumer';
import { OutboxWorker } from './infrastructure/messaging/outbox.worker';

import { CreateTenantUseCase } from './application/use-cases/create-tenant.usecase';
import { ActivateTenantUseCase } from './application/use-cases/activate-tenant.usecase';
import { SuspendTenantUseCase } from './application/use-cases/suspend-tenant.usecase';
import { ReactivateTenantUseCase } from './application/use-cases/reactivate-tenant.usecase';
import { CancelTenantUseCase } from './application/use-cases/cancel-tenant.usecase';
import { ChangePlanUseCase } from './application/use-cases/change-plan.usecase';
import { GetTenantLimitsUseCase } from './application/use-cases/get-tenant-limits.usecase';
import { GetTenantUsageUseCase } from './application/use-cases/get-tenant-usage.usecase';

import { TenantsController } from './infrastructure/http/controllers/tenants.controller';
import { InternalTenantsController } from './infrastructure/http/controllers/internal-tenants.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      store: redisStore as unknown as any,
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
  ],
  controllers: [
    TenantsController,
    InternalTenantsController,
  ],
  providers: [
    // Database
    PrismaService,
    { provide: 'ITenantRepository', useClass: PrismaTenantRepository },
    { provide: 'ISubscriptionPlanRepository', useClass: PrismaSubscriptionPlanRepository },
    { provide: 'ITenantSubscriptionRepository', useClass: PrismaTenantSubscriptionRepository },
    { provide: 'ITenantUsageService', useClass: PrismaTenantUsageService },

    // Messaging
    RabbitMQPublisher,
    RabbitMQConsumer,
    OutboxWorker,

    // Use Cases Factory Providers
    {
      provide: CreateTenantUseCase,
      useFactory: (tenantRepo, planRepo, subRepo) => {
        return new CreateTenantUseCase(tenantRepo, planRepo, subRepo);
      },
      inject: ['ITenantRepository', 'ISubscriptionPlanRepository', 'ITenantSubscriptionRepository'],
    },
    {
      provide: ActivateTenantUseCase,
      useFactory: (tenantRepo, subRepo) => {
        return new ActivateTenantUseCase(tenantRepo, subRepo);
      },
      inject: ['ITenantRepository', 'ITenantSubscriptionRepository'],
    },
    {
      provide: SuspendTenantUseCase,
      useFactory: (tenantRepo, subRepo) => {
        return new SuspendTenantUseCase(tenantRepo, subRepo);
      },
      inject: ['ITenantRepository', 'ITenantSubscriptionRepository'],
    },
    {
      provide: ReactivateTenantUseCase,
      useFactory: (tenantRepo, subRepo) => {
        return new ReactivateTenantUseCase(tenantRepo, subRepo);
      },
      inject: ['ITenantRepository', 'ITenantSubscriptionRepository'],
    },
    {
      provide: CancelTenantUseCase,
      useFactory: (tenantRepo, subRepo) => {
        return new CancelTenantUseCase(tenantRepo, subRepo);
      },
      inject: ['ITenantRepository', 'ITenantSubscriptionRepository'],
    },
    {
      provide: ChangePlanUseCase,
      useFactory: (tenantRepo, planRepo, subRepo, usageSvc) => {
        return new ChangePlanUseCase(tenantRepo, planRepo, subRepo, usageSvc);
      },
      inject: ['ITenantRepository', 'ISubscriptionPlanRepository', 'ITenantSubscriptionRepository', 'ITenantUsageService'],
    },
    {
      provide: GetTenantLimitsUseCase,
      useFactory: (tenantRepo, planRepo, subRepo) => {
        return new GetTenantLimitsUseCase(tenantRepo, planRepo, subRepo);
      },
      inject: ['ITenantRepository', 'ISubscriptionPlanRepository', 'ITenantSubscriptionRepository'],
    },
    {
      provide: GetTenantUsageUseCase,
      useFactory: (tenantRepo, usageSvc) => {
        return new GetTenantUsageUseCase(tenantRepo, usageSvc);
      },
      inject: ['ITenantRepository', 'ITenantUsageService'],
    },
  ],
})
export class AppModule {}
