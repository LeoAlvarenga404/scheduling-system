import { Injectable } from '@nestjs/common';
import { ITenantRepository } from '../../../domain/repositories/tenant-repository.interface';
import { Tenant, TenantStatus } from '../../../domain/entities/tenant';
import { TenantSubscription } from '../../../domain/entities/tenant-subscription';
import { PrismaService } from '../prisma/prisma.service';
import { CNPJ } from '../../../domain/value-objects/cnpj';

@Injectable()
export class PrismaTenantRepository implements ITenantRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const raw = await this.prisma.tenant.findUnique({ where: { id } });
    if (!raw) return null;
    return Tenant.restore({
      name: raw.name,
      slug: raw.slug,
      email: raw.email,
      phone: raw.phone,
      document: CNPJ.create(raw.document),
      status: raw.status as TenantStatus,
      activeSubscriptionId: raw.activeSubscriptionId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, raw.id);
  }

  async findByDocument(document: string): Promise<Tenant | null> {
    const raw = await this.prisma.tenant.findUnique({ where: { document } });
    if (!raw) return null;
    return Tenant.restore({
      name: raw.name,
      slug: raw.slug,
      email: raw.email,
      phone: raw.phone,
      document: CNPJ.create(raw.document),
      status: raw.status as TenantStatus,
      activeSubscriptionId: raw.activeSubscriptionId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, raw.id);
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const raw = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!raw) return null;
    return Tenant.restore({
      name: raw.name,
      slug: raw.slug,
      email: raw.email,
      phone: raw.phone,
      document: CNPJ.create(raw.document),
      status: raw.status as TenantStatus,
      activeSubscriptionId: raw.activeSubscriptionId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, raw.id);
  }

  async save(
    tenant: Tenant,
    newSubscription?: TenantSubscription,
    cancelledSubscription?: TenantSubscription
  ): Promise<void> {
    // We execute inside a transaction.
    // However, saving events correctly with outbox is the responsibility of whoever commits.
    // Since use cases fire DomainEvents through Publisher, we actually don't save events here.
    // Wait, the PRD says: "Todo evento publicado usa Outbox Pattern (atômico com a transação de banco)".
    // So the Outbox events MUST be saved here in the same Tx! We should map domain events to OutboxEvent.
    const events = tenant.domainEvents.map(event => ({
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      aggregateType: 'Tenant',
      aggregateId: tenant.id,
      eventType: event.constructor.name, // e.g., TenantCreatedEvent
      payload: event,
      occurredAt: event.occurredAt,
      correlationId: (event as any).correlationId || crypto.randomUUID(),
      version: event.version,
    }));

    await this.prisma.$transaction(async (tx) => {
      await tx.tenant.upsert({
        where: { id: tenant.id },
        create: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          email: tenant.email || '',
          phone: tenant.phone || '',
          document: tenant.document.getValue(),
          status: tenant.status,
          activeSubscriptionId: tenant.activeSubscriptionId,
        },
        update: {
          name: tenant.name,
          email: tenant.email || '',
          phone: tenant.phone || '',
          status: tenant.status,
          activeSubscriptionId: tenant.activeSubscriptionId,
          updatedAt: tenant.props.updatedAt,
        }
      });

      if (newSubscription) {
        await tx.tenantSubscription.create({
          data: {
            id: newSubscription.id,
            tenantId: newSubscription.tenantId,
            planId: newSubscription.planId,
            status: newSubscription.status,
            startedAt: newSubscription.startedAt,
            expiresAt: newSubscription.props.expiresAt,
            suspendedAt: newSubscription.props.suspendedAt,
            cancelledAt: newSubscription.props.cancelledAt,
          }
        });
      }

      if (cancelledSubscription) {
        await tx.tenantSubscription.update({
          where: { id: cancelledSubscription.id },
          data: {
            status: cancelledSubscription.status,
            cancelledAt: cancelledSubscription.props.cancelledAt,
            updatedAt: cancelledSubscription.props.updatedAt,
          }
        });
      }

      if (events.length > 0) {
        await tx.outboxEvent.createMany({
          data: events,
        });
      }
    });
  }

  async update(tenant: Tenant, subscriptionsToUpdate?: TenantSubscription[]): Promise<void> {
    const events = tenant.domainEvents.map(event => ({
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      aggregateType: 'Tenant',
      aggregateId: tenant.id,
      eventType: event.constructor.name,
      payload: event,
      occurredAt: event.occurredAt,
      correlationId: (event as any).correlationId || crypto.randomUUID(),
      version: event.version,
    }));

    await this.prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          status: tenant.status,
          activeSubscriptionId: tenant.activeSubscriptionId,
          updatedAt: tenant.props.updatedAt,
        }
      });

      if (subscriptionsToUpdate && subscriptionsToUpdate.length > 0) {
        for (const sub of subscriptionsToUpdate) {
          await tx.tenantSubscription.update({
            where: { id: sub.id },
            data: {
              status: sub.status,
              suspendedAt: sub.props.suspendedAt,
              cancelledAt: sub.props.cancelledAt,
              updatedAt: sub.props.updatedAt,
            }
          });
        }
      }

      if (events.length > 0) {
        await tx.outboxEvent.createMany({
          data: events,
        });
      }
    });
  }
}
