import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { RedisPropagatorService } from './redis-propagator.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [AuthModule],
  providers: [ChatGateway, RedisPropagatorService, PrismaService],
})
export class ChatModule {}