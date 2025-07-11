import { featureModule } from '@ditsmod/core';
import { addRest } from '@ditsmod/rest';
import { JwtModule } from '@ditsmod/jwt';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { BearerGuard } from './bearer.guard.js';
import { SecondController } from './second.controller.js';

const jwtModuleWithParams = JwtModule.withParams({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1y' } });

@addRest({
  controllers: [SecondController],
  providersPerReq: [BearerGuard],
  importsWithParams: [openapiModuleWithParams.restModuleParams],
})
@featureModule({
  imports: [openapiModuleWithParams.moduleWithParams, jwtModuleWithParams],
})
export class SecondModule {}
