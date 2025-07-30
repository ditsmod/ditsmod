import { featureModule, InitParamsMap, ModuleWithInitParams } from '@ditsmod/core';
import { JwtModule } from '@ditsmod/jwt';
import { initRest } from '@ditsmod/rest';

import { AuthController } from './auth.controller.js';
import { BearerGuard } from './bearer.guard.js';

const moduleWithParams = JwtModule.withParams({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } });

@initRest({ controllers: [AuthController], providersPerReq: [BearerGuard], exports: [BearerGuard] })
@featureModule({
  imports: [moduleWithParams],
  exports: [moduleWithParams],
})
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
