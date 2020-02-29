import {
  Injectable,
  Injector,
  Type,
  InjectionToken,
  Inject,
  ReflectiveInjector,
  reflector,
  ClassProvider
} from '@ts-stack/di';

import { EntitiesToken } from '../../../types/injection-tokens';
import { StaticEntity } from '../decorators/entity';
import { ColumnDecoratorMetadata } from '../decorators/column';
import { isColumnType, isColumn, isEntity } from '../../../utils/type-guards';
import { deepFreeze } from '../../../utils/deep-freeze';
import { flatten } from '../../../utils/ng-utils';

@Injectable()
export class EntityInjector implements Injector {
  protected injector: Injector;

  constructor(
    @Inject(EntitiesToken) protected entities: ClassProvider[][],
    protected injectorPerApp: ReflectiveInjector
  ) {
    this.getProviderWithInjector();
  }

  get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T): T;
  get(token: any, notFoundValue?: any): any;
  get(token: any, notFoundValue: any): any {
    return this.injector.get(token, notFoundValue);
  }

  /**
   * Settings an Entity and Column metadata.
   */
  protected getProviderWithInjector() {
    const dbEntities = flatten<ClassProvider>(this.entities).map(item => item.useClass);
    const resolvedProviders = ReflectiveInjector.resolve([...dbEntities, ...this.entities]);
    this.injector = this.injectorPerApp.createChildFromResolved(resolvedProviders);

    resolvedProviders.forEach(item => {
      const Token = item.key.token as Type<any>;
      const instance = this.injector.get(Token);
      const Entity = instance?.constructor as typeof StaticEntity;
      const entityMetadata = deepFreeze(reflector.annotations(Entity).find(isEntity));
      if (entityMetadata) {
        const columnMetadata = reflector.propMetadata(Entity) as ColumnDecoratorMetadata;
        // console.log(Entity);
        Entity.entityMetadata = entityMetadata;
        Entity.columnMetadata = columnMetadata;
        Entity.metadata = {
          tableName: entityMetadata.tableName || Entity.name,
          primaryColumns: [],
          dbService: {} as any
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
  }
}
