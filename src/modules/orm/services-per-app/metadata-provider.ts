import { Injectable, Inject, reflector, Type } from '@ts-stack/di';

import { EntitiesToken } from '../../../types/injection-tokens';
import { ModelMetadata, EntityModel, ModelMetadataMap } from '../decorators/entity';
import { ColumnDecoratorMetadata } from '../decorators/column';
import { isEntity } from '../../../utils/type-guards';
import { deepFreeze } from '../../../utils/deep-freeze';
import { mergeMaps } from '../../../utils/merge-maps';

@Injectable()
export class MetadataProvider {
  protected map: ModelMetadataMap;

  constructor(@Inject(EntitiesToken) protected entitiesMaps: Map<EntityModel, Type<any>>[]) {
    this.extractMetadata();
  }

  get(Token: EntityModel) {
    return this.map.get(Token);
  }

  /**
   * Settings an Entity and Column metadata.
   */
  protected extractMetadata() {
    const entitiesMap = mergeMaps(this.entitiesMaps);

    entitiesMap.forEach((Entity, Token) => {
      const entityMetadata = reflector.annotations(Entity).find(isEntity);
      if (!entityMetadata) {
        throw new Error(`Cannot found metadata for "${Entity.name}" entity`);
      }

      const columnMetadata = reflector.propMetadata(Entity) as ColumnDecoratorMetadata;
      const modelMetadata = deepFreeze<ModelMetadata>({ entityMetadata, columnMetadata });
      this.map = new Map([[Token, modelMetadata]]);
      console.log(modelMetadata);
    });

    return this.map;
  }
}
