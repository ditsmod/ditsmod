import { JwtModule } from '@ditsmod/jwt';
import { restModule } from '@ditsmod/rest';

import { AuthController } from './auth/auth.controller.js';
import { BearerGuard } from './auth/bearer.guard.js';

const dynamicModule = JwtModule.withOpts({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } });

@restModule({
  imports: [dynamicModule],
  controllers: [AuthController],
  providersPerReq: [BearerGuard],
  exports: [dynamicModule, BearerGuard],
})
export class AuthModule {}
