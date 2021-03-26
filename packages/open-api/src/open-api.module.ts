import { Module } from '@ditsmod/core';

import { OpenApiExtension } from './open-api.extension';

@Module({
  providersPerApp: [OpenApiExtension],
  extensions: [OpenApiExtension],
})
export class OpenApiModule {}
