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
  protected scanInProgress = new WeakSet();

  /**
   * Sets media type.
   */
  set<T extends mediaTypeName = mediaTypeName>(contentOptions: ContentOptions<T>) {
    const { mediaType, mediaTypeParams, model } = contentOptions;
    let schema: SchemaObject;
    if (mediaType.includes('text/')) {
      schema = { type: 'string' } as SchemaObject;
    } else {
      schema = this.getSchema(model);
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

  protected getSchema(model: Type<edk.AnyObj>) {
    const schema = { type: 'object', properties: {} } as SchemaObject;
    const modelMeta = reflector.propMetadata(model) as ColumnDecoratorMetadata;

    for (const property in modelMeta) {
      const propertySchema = modelMeta[property].find(isColumn);
      if (!propertySchema || propertySchema.type !== undefined) {
        continue;
      }
      const propertyType = modelMeta[property][0];
      schema.properties[property] = this.patchPropertySchema(model, propertyType, propertySchema);
    }

    this.scanInProgress.delete(model);
    return schema;
  }

  protected patchPropertySchema(model: Type<edk.AnyObj>, propertyType: Type<edk.AnyObj>, schema: SchemaObject) {
    if ([Boolean, Number, String, Array, Object].includes(propertyType as any)) {
      schema.type = (propertyType.name?.toLowerCase() || 'null') as SchemaObjectType;
      if (schema.type == 'array' && !schema.items) {
        schema.items = {};
      }
    } else if (propertyType instanceof Type) {
      if (this.scanInProgress.has(model)) {
        const description = `[Circular references to ${model.name}]`;
        schema = { type: 'object', description, properties: {} } as SchemaObject;
      } else {
        this.scanInProgress.add(model);
        Object.assign(schema, this.getSchema(propertyType));
      }
    } else {
      schema.type = 'null';
    }
    return schema;
  }
}

export function getContent<T extends mediaTypeName = mediaTypeName>(contentOptions?: ContentOptions<T>) {
  return new Content().get(contentOptions);
}
