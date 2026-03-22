import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaProcessedEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async exists(eventId: string, tenantId: string): Promise<boolean> {
    const count = await this.prisma.processedEvent.count({
      where: {
        eventId,
        tenantId,
      },
    });

    return count > 0;
  }

  async save(eventId: string, tenantId: string, eventType: string): Promise<void> {
    await this.prisma.processedEvent.create({
      data: {
        eventId,
        tenantId,
        eventType,
      },
    });
  }
}
