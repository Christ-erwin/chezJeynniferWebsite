import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AdminGuard } from './auth.guard.js';
import { AuthController } from './auth.controller.js';

@Global()
@Module({ controllers: [AuthController], providers: [AuthService, AdminGuard], exports: [AuthService, AdminGuard] })
export class AuthModule {}
