import { ClassProvider } from '@ts-stack/di';

import { Module, ModuleWithOptions } from '../../decorators/module';
import { EntitiesToken } from '../../types/injection-tokens';
import { EntityManager } from './services-per-req/entity-manager';
import { EntityInjector } from './services-per-app/entity-injector';

@Module({
  providersPerApp: [EntityInjector],
  providersPerReq: [EntityManager],
  exports: [EntityManager]
})
export class OrmModule {
  static withOptions(entities: ClassProvider[]): ModuleWithOptions<OrmModule> {
    return {
      module: OrmModule,
      providersPerApp: [{ provide: EntitiesToken, useValue: entities, multi: true }]
    };
  }
}
