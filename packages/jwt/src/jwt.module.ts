import { featureModule, ModuleWithParams } from '@ditsmod/core';

import { JWT_PAYLOAD } from './tokens';
import { JwtService } from './jwt.service';
import { JwtServiceOptions } from './models/jwt-service-options';

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
