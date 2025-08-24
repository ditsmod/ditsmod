import { featureModule } from '@ditsmod/core';

import { AuthService } from './auth.service.js';

@featureModule({
  providersPerMod: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
