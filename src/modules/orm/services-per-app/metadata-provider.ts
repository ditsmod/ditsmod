import { Injectable, Type, reflector } from '@ts-stack/di';

import { EntityModel, MetadataModel } from '../decorators/entity';
import { isEntity } from '../../../utils/type-guards';
import { ColumnDecoratorMetadata } from '../decorators/column';
import { deepFreeze } from '../../../utils/deep-freeze';

@Injectable()
export class MetadataProvider {
  /**
   * Settings an Entity and Column metadata.
   */
  getMetadataMap(entitiesMap: Map<EntityModel, Type<any>>) {
    const metadataMap = new Map<EntityModel, MetadataModel>();

    entitiesMap.forEach((Entity, Token) => {
      const entityMetadata = reflector.annotations(Entity).find(isEntity);
      if (!entityMetadata) {
        throw new Error(`Cannot found metadata for "${Entity.name}" entity`);
      }

      const columnMetadata = reflector.propMetadata(Entity) as ColumnDecoratorMetadata;
      const modelMetadata = deepFreeze<MetadataModel>({ entityMetadata, columnMetadata });
      metadataMap.set(Token, modelMetadata);
      // console.log(modelMetadata);
    });

    return metadataMap;
  }
}
