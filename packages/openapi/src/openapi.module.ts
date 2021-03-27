import { Module } from '@ditsmod/core';

import { OpenapiExtension } from './openapi.extension';

@Module({
  providersPerApp: [OpenapiExtension],
  extensions: [OpenapiExtension],
})
export class OpenapiModule {}
