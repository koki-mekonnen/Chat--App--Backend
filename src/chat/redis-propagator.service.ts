import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service'


interface UserStatus {
  userId: number;
  username: string;
  status: 'online' | 'offline';
  lastSeen?: Date;

}
@Injectable()
export class RedisPropagatorService {
  private socketServer: Server;
  private readonly redisSubscriber: RedisClientType;
  private readonly redisPublisher: RedisClientType;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.redisSubscriber = createClient({
      url: configService.get('REDIS_URL'),
    }) as RedisClientType;

    this.redisPublisher = createClient({
      url: configService.get('REDIS_URL'),
    }) as RedisClientType;

    this.redisSubscriber.on('message', (channel, message) => {
      this.onRedisMessage(channel, message);
    });
  }

  public injectSocketServer(server: Server): void {
    this.socketServer = server;
  }

  private onRedisMessage(channel: string, message: string): void {
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.event && parsedMessage.data) {
      this.socketServer.emit(parsedMessage.event, parsedMessage.data);
    }
  }

  public async propagateMessage(event: string, data: any): Promise<void> {
    await this.redisPublisher.publish(
      'message',
      JSON.stringify({
        event,
        data,
      }),
    );
  }

  public async connect(): Promise<void> {
    await this.redisSubscriber.connect();
    await this.redisPublisher.connect();
    await this.redisSubscriber.subscribe('message', (message) => {
      this.onRedisMessage('message', message);
    });
  }

  public async getAllUsers(): Promise<UserStatus[]> {
    try {
      // 1. Get all users from database
      const dbUsers = await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          status: true,
          lastSeen: true,

        },
      });

      // 2. Get current statuses from Redis in parallel
      const [redisStatuses, redisLastSeen] = await Promise.all([
        this.redisPublisher.hGetAll('user:status'),
        this.redisPublisher.hGetAll('user:last_seen'),
      ]);

      // 3. Combine data with proper error handling
      return dbUsers.map(user => {
        const userIdStr = user.id.toString();

        return {
          userId: user.id,
          username: user.username,
          status: (redisStatuses[userIdStr] as 'online' | 'offline') || user.status || 'offline',
          lastSeen: redisLastSeen[userIdStr]
            ? new Date(redisLastSeen[userIdStr])
            : user.lastSeen,

        };
      });
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw new Error('Failed to fetch users');
    }
  }


  public async getUser(id: number): Promise<UserStatus | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          status: true,
          lastSeen: true,

        },
      });

      if (!user) return null;

      const [status, lastSeen] = await Promise.all([
        this.redisPublisher.hGet('user:status', id.toString()),
        this.redisPublisher.hGet('user:last_seen', id.toString()),
      ]);

      return {
        userId: user.id,
        username: user.username,
        status: (status as 'online' | 'offline') || user.status || 'offline',
        lastSeen: lastSeen ? new Date(lastSeen) : user.lastSeen,
      };
    } catch (error) {
      console.error(`Error getting user ${id}:`, error);
      throw new Error('Failed to fetch user');
    }
  }



  public async updateUserStatus(
    userId: number,
    status: 'online' | 'offline'
  ): Promise<void> {
    const timestamp = new Date().toISOString();

    await Promise.all([
      this.redisPublisher.hSet('user:status', userId, status),
      this.redisPublisher.hSet('user:last_seen', userId, timestamp),


      this.prisma.user.update({
        where: { id: userId },
        data: {
          status,
          lastSeen: new Date(timestamp)
        }
      }),
      this.propagateMessage('userStatusChanged', {
        userId,
        status,
        lastSeen: timestamp
      })
    ])
  }


  public async updateLastSeen(userId: number): Promise<void> {
    const timestamp = new Date().toISOString();

    await Promise.all([
      this.redisPublisher.hSet('user:last_seen', userId, timestamp),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          lastSeen: new Date(timestamp)
        }
      })
    ]);
  }



}
