import { featureModule, InitParamsMap, ModuleWithInitParams } from '@ditsmod/core';
import { JwtModule } from '@ditsmod/jwt';
import { initRest } from '@ditsmod/rest';

import { AuthController } from './auth/auth.controller.js';
import { BearerGuard } from './auth/bearer.guard.js';

const moduleWithParams = JwtModule.withParams({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } });

@initRest({
  imports: [moduleWithParams],
  controllers: [AuthController],
  providersPerReq: [BearerGuard],
  exports: [moduleWithParams, BearerGuard],
})
@featureModule()
export class AuthModule {
  static withPath(path?: string): ModuleWithInitParams<AuthModule> {
    const initParams: InitParamsMap = new Map();
    initParams.set(initRest, { path });

    return {
      module: this,
      initParams,
    };
  }
}
