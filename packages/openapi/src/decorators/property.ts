import { AnyObj } from '@ditsmod/core';
import { makePropTypeDecorator, Type } from '@ts-stack/di';
import { XSchemaObject } from '@ts-stack/openapi-spec';

export type PropertyDecoratorFactory = (schema?: XSchemaObject, ...arrayModels: Type<AnyObj>[]) => PropertyDecorator;
export interface PropertyDecoratorItem {
  schema?: XSchemaObject;
  arrayModels?: Type<AnyObj> | Type<AnyObj>[];
}
export type PropertyDecoratorValue = [Type<AnyObj>, PropertyDecoratorItem, ...PropertyDecoratorItem[]];
export interface PropertyDecoratorMetadata {
  [key: string]: PropertyDecoratorValue;
}

function transformPropertyMeta(schema?: XSchemaObject, ...arrayModels: Type<AnyObj>[]) {
  if (arrayModels.length < 2) {
    return { schema, arrayModels: arrayModels[0] } as PropertyDecoratorItem;
  } else {
    return { schema, arrayModels } as PropertyDecoratorItem;
  }
}

/**
 * Decorator for model properties.
 * 
 * Usage:
 * 
 * ```ts
class Post {
  @Property({ type: 'number', minimum: 0, maximum: 100000 })
  postId: number;
}
 * ```
 */
export const Property = makePropTypeDecorator('Property', transformPropertyMeta) as PropertyDecoratorFactory;
