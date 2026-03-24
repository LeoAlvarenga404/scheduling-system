import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import { RefreshTokenRepository, PasswordResetTokenRepository, EmailVerificationTokenRepository } from '../../../../domain/repositories/token.repository';
import { RefreshToken } from '../../../../domain/entities/refresh-token.entity';
import { PasswordResetToken, EmailVerificationToken } from '../../../../domain/entities/tokens.entity';
import { PrismaTokenMapper } from '../mappers/prisma-token.mapper';
import { DomainEvent } from '../../../../domain/events/domain-events';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RefreshToken | null> {
    const raw = await this.prisma.refreshToken.findUnique({ where: { id } });
    return raw ? PrismaTokenMapper.toRefreshTokenDomain(raw) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const raw = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    return raw ? PrismaTokenMapper.toRefreshTokenDomain(raw) : null;
  }

  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    const raws = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    return raws.map(PrismaTokenMapper.toRefreshTokenDomain);
  }

  async save(token: RefreshToken, events: DomainEvent[] = []): Promise<void> {
    const data = PrismaTokenMapper.toRefreshTokenPersistence(token);
    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.upsert({
        where: { id: token.id },
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

  async saveMany(tokens: RefreshToken[], events: DomainEvent[] = []): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const token of tokens) {
        const data = PrismaTokenMapper.toRefreshTokenPersistence(token);
        await tx.refreshToken.upsert({
          where: { id: token.id },
          update: data,
          create: data,
        });
      }
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

@Injectable()
export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const raw = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    return raw ? PrismaTokenMapper.toPasswordResetTokenDomain(raw) : null;
  }

  async findActiveByUserId(userId: string): Promise<PasswordResetToken[]> {
    const raws = await this.prisma.passwordResetToken.findMany({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    return raws.map(PrismaTokenMapper.toPasswordResetTokenDomain);
  }

  async save(token: PasswordResetToken, events: DomainEvent[] = []): Promise<void> {
    const data = PrismaTokenMapper.toPasswordResetTokenPersistence(token);
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.upsert({
        where: { id: token.id },
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

  async saveMany(tokens: PasswordResetToken[], events: DomainEvent[] = []): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const token of tokens) {
        const data = PrismaTokenMapper.toPasswordResetTokenPersistence(token);
        await tx.passwordResetToken.upsert({
          where: { id: token.id },
          update: data,
          create: data,
        });
      }
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

@Injectable()
export class PrismaEmailVerificationTokenRepository implements EmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const raw = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    return raw ? PrismaTokenMapper.toEmailVerificationTokenDomain(raw) : null;
  }

  async save(token: EmailVerificationToken, events: DomainEvent[] = []): Promise<void> {
    const data = PrismaTokenMapper.toEmailVerificationTokenPersistence(token);
    await this.prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.upsert({
        where: { id: token.id },
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
