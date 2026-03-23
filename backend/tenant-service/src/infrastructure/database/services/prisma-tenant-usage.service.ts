import { Injectable } from '@nestjs/common';
import { ITenantUsageService } from '../../../application/use-cases/change-plan.usecase';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTenantUsageService implements ITenantUsageService {
  constructor(private prisma: PrismaService) {}

  async getCurrentUsage(tenantId: string): Promise<{ appointmentsThisMonth: number; activeProfessionals: number; activeRooms: number; }> {
    // Ideally this queries read models populated by events.
    // For now we will return 0 or do a basic implementation mock.
    // In a real CQRS system, these would query a `tenant_usage` table updated by the Inbox consumer.
    return {
      appointmentsThisMonth: 0,
      activeProfessionals: 0,
      activeRooms: 0
    };
  }
}
