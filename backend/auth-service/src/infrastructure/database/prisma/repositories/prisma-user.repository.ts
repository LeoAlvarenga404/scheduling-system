import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { User } from '../../../../domain/entities/user.entity';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id },
    });
    return raw ? PrismaUserMapper.toDomain(raw) : null;
  }

  async findByEmailAndTenant(email: string, tenantId: string | null): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: {
        email_tenantId: {
          email,
          tenantId: tenantId ?? undefined as any, // Prisma handles null, but unique index might need care
        },
      },
    });
    // Fallback if the above doesn't work for nullable tenantId in composite key
    if (!raw && tenantId === null) {
        const users = await this.prisma.user.findMany({
            where: { email, tenantId: null }
        });
        if (users.length > 0) return PrismaUserMapper.toDomain(users[0]);
    }
    
    return raw ? PrismaUserMapper.toDomain(raw) : null;
  }

  async save(user: User, events: any[] = []): Promise<void> {
    const data = PrismaUserMapper.toPersistence(user);
    
    await this.prisma.$transaction(async (tx) => {
      await tx.user.upsert({
        where: { id: user.id },
        update: data,
        create: data,
      });

      for (const event of events) {
        await tx.outboxEvent.create({
          data: {
            id: event.eventId || crypto.randomUUID(),
            type: event.constructor.name,
            payload: JSON.stringify(event),
            processed: false,
          },
        });
      }
    });
  }
}
