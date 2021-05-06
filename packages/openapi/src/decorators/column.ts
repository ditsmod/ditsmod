import { edk } from '@ditsmod/core';
import { makePropTypeDecorator, Type } from '@ts-stack/di';
import { XSchemaObject } from '@ts-stack/openapi-spec';

export type ColumnDecoratorFactory = (schema?: XSchemaObject, arrayModel?: Type<edk.AnyObj>) => PropertyDecorator;
export interface ColumnDecoratorItem {
  schema?: XSchemaObject;
  arrayModel?: Type<edk.AnyObj>;
}
export type ColumnDecoratorValue = [Type<edk.AnyObj>, ColumnDecoratorItem, ...ColumnDecoratorItem[]];
export interface ColumnDecoratorMetadata {
  [key: string]: ColumnDecoratorValue;
}

function transformColumnMeta(schema?: XSchemaObject, arrayModel?: Type<edk.AnyObj>) {
  return { schema, arrayModel } as ColumnDecoratorItem;
}

/**
 * Decorator for model properties.
 * 
 * Usage:
 * 
 * ```ts
class Post {
  @Column({ type: 'number', minimum: 0, maximum: 100000 })
  postId: number;
}
 * ```
 */
export const Column = makePropTypeDecorator('Column', transformColumnMeta) as ColumnDecoratorFactory;
