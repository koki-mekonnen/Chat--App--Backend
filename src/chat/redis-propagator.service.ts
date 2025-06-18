import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisPropagatorService {
  private socketServer: Server;
  private readonly redisSubscriber: RedisClientType;
  private readonly redisPublisher: RedisClientType;

  constructor(private readonly configService: ConfigService) {
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
}