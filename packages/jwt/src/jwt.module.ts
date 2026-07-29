import { featureModule, DynamicModule } from '@ditsmod/core';
import { mixinRest } from '@ditsmod/rest';

import { JwtService } from './jwt.service.js';
import { JwtServiceOptions } from './models/jwt-service-options.js';

@mixinRest({
  providersPerApp: [JwtServiceOptions],
  providersPerReq: [JwtService],
  exports: [JwtService],
})
@featureModule()
export class JwtModule {
  static withOpts(jwtServiceOptions: JwtServiceOptions): DynamicModule<JwtModule> {
    return {
      module: this,
      providersPerMod: [{ token: JwtServiceOptions, useValue: jwtServiceOptions }],
    };
  }
}
