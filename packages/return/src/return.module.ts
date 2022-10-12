import { HttpBackend, Module } from '@ditsmod/core';

import { ReturnHttpBackend } from './return-http-backend';

@Module({
  providersPerReq: [{ provide: HttpBackend, useClass: ReturnHttpBackend }],
  exports: [HttpBackend]
})
export class ReturnModule {}
