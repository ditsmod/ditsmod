import { ReflectiveInjector, Type, reflector, Provider } from 'ts-di';

import { Module, ModuleWithOptions } from '../../decorators/module';
import { EntityInjector, StaticEntity } from './decorators/entity';
import { isEntity, isColumnType, isColumn } from '../../utils/type-guards';
import { ColumnDecoratorMetadata } from './decorators/column';

@Module()
export class OrmModule {
  static withOptions(entities: Provider[]): ModuleWithOptions<OrmModule> {
    return {
      module: OrmModule,
      providersPerApp: [this.getProviderWithInjector(entities)]
    };
  }

  /**
   * Settings an Entity and Column metadata.
   */
  protected static getProviderWithInjector(entities: Provider[] = []) {
    const resolvedProviders = ReflectiveInjector.resolve(entities);
    const injector = ReflectiveInjector.fromResolvedProviders(resolvedProviders);

    resolvedProviders.forEach(item => {
      const Token = item.key.token as Type<any>;
      const instance = injector.get(Token);
      const Entity = instance?.constructor as typeof StaticEntity;
      const entityMetadata = reflector.annotations(Entity).find(isEntity);
      if (entityMetadata) {
        const columnMetadata = reflector.propMetadata(Entity) as ColumnDecoratorMetadata;
        // console.log(columnMetadata);
        Entity.entityMetadata = entityMetadata;
        Entity.columnMetadata = columnMetadata;
        Entity.metadata = {
          tableName: entityMetadata.tableName || Entity.name,
          primaryColumns: [],
          databaseService: {} as any
        };
        for (const prop in columnMetadata) {
          const type = columnMetadata[prop].find(isColumnType);
          const column = columnMetadata[prop].find(isColumn);
          if (column.isPrimaryColumn) {
            Entity.metadata.primaryColumns.push(prop);
          }
          // console.log(prop, type);
        }
        // console.log(Entity.metadata.primaryColumns);
      }
    });

    return { provide: EntityInjector, useValue: injector };
  }
}
