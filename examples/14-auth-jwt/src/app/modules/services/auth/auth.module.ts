import { featureModule } from '@ditsmod/core';
import { JwtModule } from '@ditsmod/jwt';
import { RoutingModule } from '@ditsmod/routing';

import { AuthController } from './auth.controller.js';
import { BearerGuard } from './bearer.guard.js';

const moduleWithParams = JwtModule.withParams({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } });

@featureModule({
  imports: [RoutingModule, moduleWithParams],
  controllers: [AuthController],
  providersPerReq: [BearerGuard],
  exports: [BearerGuard, moduleWithParams]
})
export class AuthModule {}