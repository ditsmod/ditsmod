import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';
import { JwtModule } from '@ditsmod/jwt';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { BearerGuard } from './bearer.guard.js';
import { SecondController } from './second.controller.js';

const jwtModuleWithParams = JwtModule.withParams({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1y' } });

@initRest({
  controllers: [SecondController],
  providersPerReq: [BearerGuard],
})
@featureModule({
  imports: [openapiModuleWithParams, jwtModuleWithParams],
})
export class SecondModule {}
