import { mod, ModuleWithParams } from '@ditsmod/core';

import { JwtService } from './jwt.service';
import { JwtServiceOptions } from './models/jwt-service-options';

@mod({
  providersPerApp: [JwtServiceOptions],
  providersPerReq: [JwtService],
  exports: [JwtService],
})
export class JwtModule {
  static withParams(jwtServiceOptions: JwtServiceOptions): ModuleWithParams<JwtModule> {
    return {
      module: this,
      providersPerMod: [{ token: JwtServiceOptions, useValue: jwtServiceOptions }],
    };
  }
}
