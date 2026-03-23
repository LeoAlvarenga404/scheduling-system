import { Injectable } from '@nestjs/common';
import { ITenantSubscriptionRepository } from '../../../domain/repositories/tenant-repository.interface';
import { TenantSubscription, SubscriptionStatus } from '../../../domain/entities/tenant-subscription';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTenantSubscriptionRepository implements ITenantSubscriptionRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<TenantSubscription | null> {
    const raw = await this.prisma.tenantSubscription.findUnique({ where: { id } });
    if (!raw) return null;
    return TenantSubscription.create({
      tenantId: raw.tenantId,
      planId: raw.planId,
      status: raw.status as SubscriptionStatus,
      startedAt: raw.startedAt,
      expiresAt: raw.expiresAt,
      suspendedAt: raw.suspendedAt,
      cancelledAt: raw.cancelledAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, raw.id);
  }

  async findActiveByTenantId(tenantId: string): Promise<TenantSubscription | null> {
    const raw = await this.prisma.tenantSubscription.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE'
      }
    });
    if (!raw) return null;
    
    return TenantSubscription.create({
      tenantId: raw.tenantId,
      planId: raw.planId,
      status: raw.status as SubscriptionStatus,
      startedAt: raw.startedAt,
      expiresAt: raw.expiresAt,
      suspendedAt: raw.suspendedAt,
      cancelledAt: raw.cancelledAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, raw.id);
  }
}
