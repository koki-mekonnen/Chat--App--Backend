import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { RedisPropagatorService } from './redis-propagator.service';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly redisPropagatorService: RedisPropagatorService) { }

    afterInit(server: Server) {
        this.redisPropagatorService.injectSocketServer(server);
    }

    // async onModuleInit() {
    //     await this.redisPropagatorService.connect();
    // }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendMessage')
    async handleMessage(
        @MessageBody() payload: { content: string },
        @ConnectedSocket() client: Socket,
    ) {
        const user = client.data.user;
        const message = {
            content: payload.content,
            userId: user.id,
            username: user.username,
            createdAt: new Date(),
        };

        // Broadcast to all clients
        this.server.emit('receiveMessage', message);
    }
}