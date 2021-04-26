import { makePropTypeDecorator } from '@ts-stack/di';
import { XSchemaObject } from '@ts-stack/openapi-spec';

export type SchemaDecoratorFactory = (options?: XSchemaObject) => PropertyDecorator;

export type SchemaDecoratorValue = [unknown, XSchemaObject, ...XSchemaObject[]];
export interface SchemaDecoratorMetadata {
  [key: string]: SchemaDecoratorValue;
}

/**
 * Open API Specification schema for model properties.
 * 
 * For example:
 * 
 * ```ts
class Post {
  @Schema({ type: 'number', minimum: 0, maximum: 100000 })
  postId: number;
}
 * ```
 */
export const Schema = makePropTypeDecorator('Schema', (val) => val) as SchemaDecoratorFactory;
