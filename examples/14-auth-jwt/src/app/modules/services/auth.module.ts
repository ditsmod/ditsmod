import { JwtModule } from '@ditsmod/jwt';
import { restModule } from '@ditsmod/rest';

import { AuthController } from './auth/auth.controller.js';
import { BearerGuard } from './auth/bearer.guard.js';

const moduleWithParams = JwtModule.withParams({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } });

@restModule({
  imports: [moduleWithParams],
  controllers: [AuthController],
  providersPerReq: [BearerGuard],
  exports: [moduleWithParams, BearerGuard],
})
export class AuthModule {}
