import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { SchedulingModule } from "./scheduling.module";

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
    SchedulingModule,
  ],
})
export class AppModule {}
