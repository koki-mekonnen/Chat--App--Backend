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
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
})

export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly redisPropagatorService: RedisPropagatorService,
        private readonly authService: AuthService
    ) { }

    afterInit(server: Server) {
        this.redisPropagatorService.injectSocketServer(server);
    }

    async onModuleInit() {
        await this.redisPropagatorService.connect();
    }

    @UseGuards(WsJwtGuard)
    async handleConnection(@ConnectedSocket() client: Socket) {
        const token =
            client.handshake?.auth?.token ||
            client.handshake?.query?.token ||
            (client.handshake?.headers?.authorization?.split(' ')[1]);
        const user = await this.authService.validateToken(token);

        client.data.user = user;

        if (!user) {
            console.error('No user found in connection handler');
            return;
        }

        // console.log(`Client connected : ${client.data.user}`);


        await this.redisPropagatorService.updateUserStatus(user.sub, 'online');

        const users = await this.redisPropagatorService.getAllUsers();
        this.server.emit('userStatusChanged', {
            userId: user.id,
            status: 'online',
            users: Array.from(users.values()),
        });

        client.join(`user_${user.id}`);
        // console.log(`Client connected: ${client}`);


        console.log(`Client connected: ${user.sub}`);
    }

    @UseGuards(WsJwtGuard)
    async handleDisconnect(@ConnectedSocket() client: Socket) {
        const token =
            client.handshake?.auth?.token ||
            client.handshake?.query?.token ||
            (client.handshake?.headers?.authorization?.split(' ')[1]);

        const user = await this.authService.validateToken(token);
        client.data.user = user;

        if (!user) return;

        await this.redisPropagatorService.updateUserStatus(user.sub, 'offline');

        const users = await this.redisPropagatorService.getAllUsers();
        this.server.emit('userStatusChanged', {
            userId: user.sub,
            status: 'offline',
            users: Array.from(users.values()),
        });

        client.leave(`user_${user.sub}`);

        console.log(`Client disconnected: ${user.sub}`);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('getallusers')
    async handleGetAllUsers(
        @MessageBody() _: any,
        @ConnectedSocket() client: Socket,
    ) {
        const users = await this.redisPropagatorService.getAllUsers();
        // console.log(users);
        client.emit('getallusers', Array.isArray(users) ? users : []);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('getuser')
    async handleGetUser(
        @MessageBody() userId: number,
        @ConnectedSocket() client: Socket,
    ) {
        const user = await this.redisPropagatorService.getUser(userId);
        client.emit('getuser', user || null);
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

        await this.redisPropagatorService.propagateMessage('receiveMessage', message);
    }


    @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendprivateMessage')
    async handlePrivateMessage(
        @MessageBody() payload: { reciverId: number, content: string },
        @ConnectedSocket() client: Socket,
    ) {
        const user = client.data.user;
        const message = {
            content: payload.content,
            reciverId: payload.reciverId,
            senderId: user.sub,
            username: user.username,
            createdAt: new Date().toISOString(),
        };

        console.log('Sending message:', message);


        await this.redisPropagatorService.propagateMessage('receiveMessage', message);

        return { status: 'success', message: 'Message sent successfully' };
    }
}