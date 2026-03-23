import { Injectable } from '@nestjs/common';
import { ISubscriptionPlanRepository } from '../../../domain/repositories/tenant-repository.interface';
import { SubscriptionPlan } from '../../../domain/entities/subscription-plan';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaSubscriptionPlanRepository implements ISubscriptionPlanRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<SubscriptionPlan | null> {
    const raw = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!raw) return null;
    return SubscriptionPlan.create({
      name: raw.name,
      maxAppointmentsPerMonth: raw.maxAppointmentsPerMonth,
      maxProfessionals: raw.maxProfessionals,
      maxRooms: raw.maxRooms,
      features: raw.features,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, raw.id);
  }

  async findAll(): Promise<SubscriptionPlan[]> {
    const rawPlans = await this.prisma.subscriptionPlan.findMany();
    return rawPlans.map(raw => SubscriptionPlan.create({
      name: raw.name,
      maxAppointmentsPerMonth: raw.maxAppointmentsPerMonth,
      maxProfessionals: raw.maxProfessionals,
      maxRooms: raw.maxRooms,
      features: raw.features,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }, raw.id));
  }
}
