import { Module } from '@ts-stack/ditsmod';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './permissions.guard';

@Module({
  providersPerReq: [AuthGuard, PermissionsGuard, AuthService],
  exports: [AuthGuard, PermissionsGuard, AuthService],
})
export class AuthModule {}
