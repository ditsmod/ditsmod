import { edk } from '@ditsmod/core';
import { makePropTypeDecorator, Type } from '@ts-stack/di';
import { XSchemaObject } from '@ts-stack/openapi-spec';

export type ColumnDecoratorFactory = (options?: XSchemaObject) => PropertyDecorator;

export type ColumnDecoratorValue = [Type<edk.AnyObj>, XSchemaObject, ...XSchemaObject[]];
export interface ColumnDecoratorMetadata {
  [key: string]: ColumnDecoratorValue;
}

/**
 * Decorator for model properties schema.
 * 
 * For example:
 * 
 * ```ts
class Post {
  @Column({ type: 'number', minimum: 0, maximum: 100000 })
  postId: number;
}
 * ```
 */
export const Column = makePropTypeDecorator('Column', (val) => val) as ColumnDecoratorFactory;
