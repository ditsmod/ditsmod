import { restModule } from '@ditsmod/rest';
import { JwtModule } from '@ditsmod/jwt';

import { openapiModuleWithParams } from '#service/openapi/openapi.module.js';
import { BearerGuard } from './second/bearer.guard.js';
import { SecondController } from './second/second.controller.js';

const jwtModuleWithParams = JwtModule.withParams({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1y' } });

@restModule({
  imports: [{ ...openapiModuleWithParams }, jwtModuleWithParams],
  controllers: [SecondController],
  providersPerReq: [BearerGuard],
})
export class SecondModule {}
