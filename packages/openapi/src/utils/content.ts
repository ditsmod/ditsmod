import { edk } from '@ditsmod/core';
import { reflector, Type } from '@ts-stack/di';
import { SchemaObject, SchemaObjectType, XEncodingObject, XMediaTypeObject } from '@ts-stack/openapi-spec';

import { ColumnDecoratorMetadata } from '../decorators/column';
import { mediaTypeName } from '../types/media-types';
import { isColumn } from './type-guards';

interface ContentOptions<T extends mediaTypeName = mediaTypeName> {
  mediaType: T;
  mediaTypeParams?: string;
  model?: Type<edk.AnyObj>;
  /**
   * A map between a property name and its encoding information. The key, being the property name,
   * MUST exist in the schema as a property. The encoding object SHALL only apply to `requestBody`
   * objects when the media type is `multipart` or `application/x-www-form-urlencoded`.
   */
  encoding?: { [encodingName: string]: XEncodingObject };
}

export class Content {
  protected content: { [mediaTypeName: string]: XMediaTypeObject } = {};

  /**
   * Sets media type.
   */
  set<T extends mediaTypeName = mediaTypeName>(contentOptions: ContentOptions<T>) {
    const { mediaType, mediaTypeParams, model } = contentOptions;
    const schema = { type: 'object', properties: {} } as SchemaObject;
    const meta = reflector.propMetadata(model) as ColumnDecoratorMetadata;
    Object.keys(meta).forEach((property) => {
      const columnSchema = meta[property].find(isColumn);
      if (columnSchema.type === undefined) {
        const propertyType = meta[property][0];
        this.setColumnType(columnSchema, propertyType);
        if (columnSchema.type == 'array' && !columnSchema.items) {
          columnSchema.items = {};
        }
      }
      schema.properties[property] = columnSchema;
    });

    const params = mediaTypeParams ? `;${mediaTypeParams}` : '';
    this.content[`${mediaType}${params}`] = { schema, encoding: contentOptions.encoding } as XMediaTypeObject;

    return this;
  }

  get<T extends mediaTypeName = mediaTypeName>(contentOptions?: ContentOptions<T>) {
    if (contentOptions) {
      this.set(contentOptions);
    }
    return { ...this.content };
  }

  protected setColumnType(schema: SchemaObject, propertyType: Type<edk.AnyObj>) {
    if (schema.type === undefined) {
      if ([Boolean, Number, String, Array, Object].includes(propertyType as any)) {
        schema.type = (propertyType.name?.toLowerCase() || 'null') as SchemaObjectType;
      } else if (propertyType instanceof Type) {
        schema.type = 'object';
      } else {
        schema.type = 'null';
      }
    }
  }
}

export function getContent<T extends mediaTypeName = mediaTypeName>(contentOptions?: ContentOptions<T>) {
  return new Content().get(contentOptions);
}
