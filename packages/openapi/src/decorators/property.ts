import { AnyObj, makePropDecorator, Class } from '@ditsmod/core';
import { XSchemaObject } from '@ts-stack/openapi-spec';

export type AnyEnum<T extends number | string = number | string> = Record<T, T>;

export interface CustomType {
  array?: Class<AnyObj> | any[];
  enum?: AnyEnum | AnyEnum[];
}
export type PropertyDecoratorFactory = (schema?: XSchemaObject, customType?: CustomType) => PropertyDecorator;
export interface PropertyDecoratorItem {
  schema?: XSchemaObject;
  customType?: CustomType;
}
export type PropertyDecoratorValue = [Class<AnyObj>, PropertyDecoratorItem, ...PropertyDecoratorItem[]];
export interface PropertyDecoratorMetadata {
  [key: string]: PropertyDecoratorValue;
}

function transformPropertyMeta(schema?: XSchemaObject, customType?: CustomType) {
  return { schema, customType };
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
export const property = makePropDecorator(transformPropertyMeta, undefined, 'property');
