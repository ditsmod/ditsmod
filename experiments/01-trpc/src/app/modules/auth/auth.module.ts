import { featureModule } from '@ditsmod/core';
import { initTrpc } from '@ditsmod/trpc';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@initTrpc({
  controllers: [AuthController],
  providersPerApp: [AuthService],
})
@featureModule()
export class AuthModule {}
