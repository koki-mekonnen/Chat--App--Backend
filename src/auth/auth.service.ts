import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';


@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.prisma.user.findUnique({ where: { username } });
        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.username, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async validateToken(token: string) {
        return this.jwtService.verify(token);
    }

    async register(username: string, password: string): Promise<any> {
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await this.prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                },
            });

            const { password: _, ...result } = user;
            return result;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new ConflictException('Username already exists');
                }
            }
            console.error('Registration error:', error);
            throw new InternalServerErrorException('Registration failed');
        }
    }
}