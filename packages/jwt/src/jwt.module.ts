import { featureModule, ModuleWithParams } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';

import { JWT_PAYLOAD } from './tokens.js';
import { JwtService } from './jwt.service.js';
import { JwtServiceOptions } from './models/jwt-service-options.js';

@initRest({
  providersPerReq: [JwtService, { token: JWT_PAYLOAD, useValue: {} }],
  exports: [JwtService, JWT_PAYLOAD],
})
@featureModule({ providersPerApp: [JwtServiceOptions] })
export class JwtModule {
  static withParams(jwtServiceOptions: JwtServiceOptions): ModuleWithParams<JwtModule> {
    return {
      module: this,
      providersPerMod: [{ token: JwtServiceOptions, useValue: jwtServiceOptions }],
    };
  }
}
