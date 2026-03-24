import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { OutboxWorker } from './outbox.worker';
import { PrismaModule } from '../database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RabbitMQService, OutboxWorker],
  exports: [RabbitMQService],
})
export class MessagingModule {}
