import { Type } from '@ts-stack/di';

import { Module, ModuleWithOptions } from '../../decorators/module';
import { EntitiesToken } from '../../types/injection-tokens';
import { EntityManager } from './services-per-req/entity-manager';
import { MetadataProvider } from './services-per-app/metadata-provider';
import { EntityModel } from './decorators/entity';
import { Logger } from '../../types/logger';

@Module({
  providersPerApp: [MetadataProvider, Logger],
  providersPerReq: [EntityManager],
  exports: [EntityManager]
})
export class OrmModule {
  static withOptions(entities: Map<EntityModel, Type<any>>): ModuleWithOptions<OrmModule> {
    return {
      module: OrmModule,
      providersPerApp: [{ provide: EntitiesToken, useValue: entities, multi: true }]
    };
  }
}
