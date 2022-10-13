import { HttpBackend, Module } from '@ditsmod/core';

import { ReturnHttpBackend } from './return-http-backend';

/**
 * Allow listen value returned by a controller's route.
 */
@Module({
  providersPerReq: [{ provide: HttpBackend, useClass: ReturnHttpBackend }],
  exports: [HttpBackend]
})
export class ReturnModule {}
