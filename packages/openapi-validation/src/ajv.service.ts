import { inject, injectable, optional } from '@ditsmod/core';
import Ajv, { Options, ValidateFunction } from 'ajv';
import { XSchemaObject } from '@ts-stack/openapi-spec';

import { AJV_OPTIONS } from './constants.js';

@injectable()
export class AjvService {
  #map = new Map<XSchemaObject, ValidateFunction>();
  ajv: Ajv.default;

  constructor(@optional() @inject(AJV_OPTIONS) ajvOptions?: Options | null) {
    this.ajv = new Ajv.default(ajvOptions || {});
  }

  addValidator(schema: XSchemaObject) {
    this.#map.set(schema, this.ajv.compile(schema));
    return this;
  }

  getValidator(schema: XSchemaObject) {
    return this.#map.get(schema);
  }
}
