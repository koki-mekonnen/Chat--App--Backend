import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Request
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';


@Controller('/auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return this.authService.login(req.user);
    }

    @Post('register')
    async register(
        @Body('username') username: string,
        @Body('password') password: string,
    ) {
        const user = await this.authService.register(username, password);
        return this.authService.login(user);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('validate-token')
    validateToken(@Request() req) {
     return { valid: true, user: req.user };
    }
}