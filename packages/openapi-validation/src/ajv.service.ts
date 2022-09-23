import { Inject, Injectable, Optional } from '@ts-stack/di';
import Ajv, { Options, ValidateFunction } from 'ajv';
import { XSchemaObject } from '@ts-stack/openapi-spec';

import { AJV_OPTIONS } from './constants';

@Injectable()
export class AjvService {
  #map = new Map<XSchemaObject, ValidateFunction>();
  ajv: Ajv;

  constructor(@Optional() @Inject(AJV_OPTIONS) ajvOptions?: Options | null) {
    this.ajv = new Ajv(ajvOptions || {});
  }

  addValidator(schema: XSchemaObject) {
    this.#map.set(schema, this.ajv.compile(schema));
    return this;
  }

  getValidator(schema: XSchemaObject) {
    return this.#map.get(schema);
  }
}
