import { featureModule } from '@ditsmod/core';
import { JwtModule } from '@ditsmod/jwt';
import { addRest, RestModule } from '@ditsmod/rest';

import { AuthController } from './auth.controller.js';
import { BearerGuard } from './bearer.guard.js';

const moduleWithParams = JwtModule.withParams({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } });

@addRest({ controllers: [AuthController], providersPerReq: [BearerGuard], exports: [BearerGuard] })
@featureModule({
  imports: [RestModule, moduleWithParams],
  exports: [moduleWithParams],
})
export class AuthModule {}
