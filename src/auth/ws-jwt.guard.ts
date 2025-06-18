import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private authService: AuthService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client = context.switchToWs().getClient();
        // const token = client.handshake.query.token;
        const token = client.handshake?.auth?.token ||
            context.switchToWs().getData()?.token ||
            client.handshake?.headers?.authorization?.split(' ')[1];


        if (!token) {
            throw new WsException('Missing token');
        }

        try {
            const user = await this.authService.validateToken(token);
            client.data.user = user;
            return true;
        } catch (e) {
            throw new WsException('Invalid token');
        }
    }
}