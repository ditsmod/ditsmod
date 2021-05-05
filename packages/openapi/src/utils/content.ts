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
  protected startScan = new WeakSet();

  /**
   * Sets media type.
   */
  set<T extends mediaTypeName = mediaTypeName>(contentOptions: ContentOptions<T>) {
    const { mediaType, mediaTypeParams, model } = contentOptions;
    let schema: SchemaObject;
    if (mediaType.includes('text/')) {
      schema = { type: 'string' } as SchemaObject;
    } else {
      schema = this.setObjectSchema(model);
    }

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

  protected setObjectSchema(model: Type<edk.AnyObj>) {
    const schema = { type: 'object', properties: {} } as SchemaObject;
    const modelMeta = reflector.propMetadata(model) as ColumnDecoratorMetadata;

    for (const property in modelMeta) {
      let columnSchema = modelMeta[property].find(isColumn);
      if (!columnSchema || columnSchema.type !== undefined) {
        continue;
      }
      const propertyType = modelMeta[property][0];

      if ([Boolean, Number, String, Array, Object].includes(propertyType as any)) {
        columnSchema.type = (propertyType.name?.toLowerCase() || 'null') as SchemaObjectType;
      } else if (propertyType instanceof Type) {
        if (this.startScan.has(model)) {
          columnSchema = {
            type: 'object',
            description: `[Circular references to ${model.name}]`,
            properties: {},
          } as SchemaObject;
        } else {
          this.startScan.add(model);
          Object.assign(columnSchema, this.setObjectSchema(propertyType));
        }
      } else {
        columnSchema.type = 'null';
      }

      if (columnSchema.type == 'array' && !columnSchema.items) {
        columnSchema.items = {};
      }
      schema.properties[property] = columnSchema;
    }

    this.startScan.delete(model);
    return schema;
  }
}

export function getContent<T extends mediaTypeName = mediaTypeName>(contentOptions?: ContentOptions<T>) {
  return new Content().get(contentOptions);
}
