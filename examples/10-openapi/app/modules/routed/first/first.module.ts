import { Module } from '@ditsmod/core';

import { openapiModuleWithParams } from '../../services/openapi/openapi.module';
import { FirstController } from './first.controller';

@Module({
  imports: [openapiModuleWithParams],
  controllers: [FirstController],
})
export class FirstModule {}
