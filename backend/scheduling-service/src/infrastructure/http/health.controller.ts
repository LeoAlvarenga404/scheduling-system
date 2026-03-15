import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../database/prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: "ok"; timestamp: string }> {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
