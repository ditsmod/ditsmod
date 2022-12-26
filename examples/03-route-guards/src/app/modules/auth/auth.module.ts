import { featureModule } from '@ditsmod/core';

import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './permissions.guard';

@featureModule({
  providersPerReq: [AuthGuard, PermissionsGuard, AuthService],
  exports: [AuthGuard, PermissionsGuard],
})
export class AuthModule {}
