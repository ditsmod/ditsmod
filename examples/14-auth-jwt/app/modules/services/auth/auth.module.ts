import { Module } from '@ditsmod/core';
import { JwtModule } from '@ditsmod/jwt';

import { AuthController } from './auth.controller';
import { BearerGuard } from './bearer.guard';

@Module({
  imports: [JwtModule.withParams({ secret: 'hard-to-guess-secret', signOptions: { expiresIn: '2m' } })],
  controllers: [AuthController],
  providersPerReq: [BearerGuard],
  exports: [BearerGuard]
})
export class AuthModule {}