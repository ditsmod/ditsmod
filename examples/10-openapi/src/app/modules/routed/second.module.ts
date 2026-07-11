import { restModule } from '@ditsmod/rest';
import { JwtModule } from '@ditsmod/jwt';

import { openapiDynamicModule } from '#service/openapi/openapi.module.js';
import { BearerGuard } from './second/bearer.guard.js';
import { SecondController } from './second/second.controller.js';

const jwtDynamicModule = JwtModule.withOpts({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: '1y' } });

@restModule({
  imports: [
    // @todo Remove this later
    { ...openapiDynamicModule, path: 'second' },
    jwtDynamicModule,
  ],
  controllers: [SecondController],
  providersPerReq: [BearerGuard],
})
export class SecondModule {}
