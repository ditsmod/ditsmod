import { featureModule } from '@ditsmod/core';
import { JwtModule } from '@ditsmod/jwt';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { BearerGuard } from './bearer.guard.js';
import { SecondController } from './second.controller.js';

const jwtModuleWithParams = JwtModule.withParams({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1y' } });

@featureModule({
  imports: [openapiModuleWithParams, jwtModuleWithParams],
  controllers: [SecondController],
  providersPerReq: [BearerGuard]
})
export class SecondModule {}