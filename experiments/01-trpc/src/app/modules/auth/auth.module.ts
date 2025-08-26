import { featureModule } from '@ditsmod/core';
import { initTrpcModule } from '@ditsmod/trpc';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@initTrpcModule({
  controllers: [AuthController],
  providersPerApp: [AuthService],
})
@featureModule()
export class AuthModule {}
