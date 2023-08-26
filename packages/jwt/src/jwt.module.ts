import { featureModule, ModuleWithParams } from '@ditsmod/core';

import { JWT_PAYLOAD } from './tokens.js';
import { JwtService } from './jwt.service.js';
import { JwtServiceOptions } from './models/jwt-service-options.js';

@featureModule({
  providersPerApp: [JwtServiceOptions],
  providersPerReq: [JwtService, { token: JWT_PAYLOAD, useValue: {} }],
  exports: [JwtService, JWT_PAYLOAD],
})
export class JwtModule {
  static withParams(jwtServiceOptions: JwtServiceOptions): ModuleWithParams<JwtModule> {
    return {
      module: this,
      providersPerMod: [{ token: JwtServiceOptions, useValue: jwtServiceOptions }],
    };
  }
}
