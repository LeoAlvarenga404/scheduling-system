import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma/prisma.module';
import { OutboxProcessorService } from './outbox-processor.service';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  imports: [PrismaModule],
  providers: [RabbitMQService, OutboxProcessorService],
  exports: [RabbitMQService],
})
export class MessagingModule {}
