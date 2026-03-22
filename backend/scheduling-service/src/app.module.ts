import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { SchedulingModule } from "./scheduling.module";
import { RedisModule } from "./infrastructure/database/redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? "development"}.local`,
        `.env.${process.env.NODE_ENV ?? "development"}`,
        ".env.local",
        ".env",
      ],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    SchedulingModule,
  ],
})
export class AppModule {}
