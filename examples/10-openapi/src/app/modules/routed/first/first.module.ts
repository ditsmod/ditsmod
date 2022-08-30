import { Module, ModuleWithParams } from '@ditsmod/core';
import { OpenapiModule } from '@ditsmod//openapi';

import { openapiModuleWithParams } from '../../services/openapi/openapi.module';
import { FirstController } from './first.controller';

const firstOpenapiModule: ModuleWithParams<OpenapiModule> = {...openapiModuleWithParams, path: ''}

@Module({
  imports: [firstOpenapiModule],
  controllers: [FirstController],
})
export class FirstModule {}
