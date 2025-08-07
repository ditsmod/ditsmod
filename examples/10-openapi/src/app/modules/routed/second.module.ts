import { featureModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';
import { JwtModule } from '@ditsmod/jwt';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { BearerGuard } from './second/bearer.guard.js';
import { SecondController } from './second/second.controller.js';

const jwtModuleWithParams = JwtModule.withParams({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1y' } });

@initRest({
  imports: [openapiModuleWithParams, jwtModuleWithParams],
  controllers: [SecondController],
  providersPerReq: [BearerGuard],
})
@featureModule()
export class SecondModule {}
