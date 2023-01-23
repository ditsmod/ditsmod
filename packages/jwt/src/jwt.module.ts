import { featureModule, ModuleWithParams } from '@ditsmod/core';

import { JwtPayload } from './jwt-payload';
import { JwtService } from './jwt.service';
import { JwtServiceOptions } from './models/jwt-service-options';

@featureModule({
  providersPerApp: [JwtServiceOptions],
  providersPerReq: [JwtService, JwtPayload],
  exports: [JwtService, JwtPayload],
})
export class JwtModule {
  static withParams(jwtServiceOptions: JwtServiceOptions): ModuleWithParams<JwtModule> {
    return {
      module: this,
      providersPerMod: [{ token: JwtServiceOptions, useValue: jwtServiceOptions }],
    };
  }
}
