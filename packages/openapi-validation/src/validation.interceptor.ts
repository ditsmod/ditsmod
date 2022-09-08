import { Injectable } from '@ts-stack/di';
import { HttpHandler, HttpInterceptor, Req, Status, CustomError } from '@ditsmod/core';
import { Cookies } from '@ts-stack/cookies';
import { XSchemaObject } from '@ts-stack/openapi-spec';
import { DictService } from '@ditsmod/i18n';

import { IS_REQUIRED, ValidationRouteMeta, VALIDATION_ARGS } from './types';
import { AssertService } from './assert.service';
import { AssertDict } from './locales/current';

type ParamIn = 'query' | 'path' | 'cookie' | 'header' | 'body';

@Injectable()
export class ValidationInterceptor implements HttpInterceptor {
  constructor(
    private req: Req,
    private validationMeta: ValidationRouteMeta,
    private assert: AssertService,
    private dictService: DictService
  ) {}

  intercept(next: HttpHandler) {
    this.validateParams();
    this.validateRequestBody();
    return next.handle();
  }

  protected validateParams() {
    const { parameters } = this.validationMeta;
    for (const parameter of parameters) {
      const schema = parameter.schema as XSchemaObject<any>;
      const { required } = parameter;
      const args = schema[VALIDATION_ARGS] || [];
      let value: any;
      if (parameter.in == 'path') {
        value = this.req.pathParams[parameter.name];
      } else if (parameter.in == 'query') {
        value = this.req.queryParams[parameter.name];
      } else if (parameter.in == 'cookie') {
        const cookies = new Cookies(this.req.nodeReq, this.req.nodeRes);
        value = cookies.get(parameter.name);
      } else if (parameter.in == 'header') {
        value = this.req.nodeReq.headers[parameter.name];
      }

      this.checkParamsOrBody(parameter.in, schema, parameter.name, value, required, args);
    }
  }

  protected coerceType(paramIn: ParamIn, name: string, value: string | number | boolean) {
    if (paramIn == 'path') {
      this.req.pathParams[name] = value;
    } else if (paramIn == 'query') {
      this.req.queryParams[name] = value;
    } else if (paramIn == 'body') {
      this.req.body[name] = value;
    }
  }

  protected validateRequestBody() {
    if (!this.validationMeta.requestBodyProperties) {
      return;
    }

    if (!this.req.body) {
      const dict = this.dictService.getDictionary(AssertDict);
      throw new CustomError({ msg1: dict.missingRequestBody, status: Status.BAD_REQUEST });
    }

    for (const prop in this.validationMeta.requestBodyProperties) {
      const schema = this.validationMeta.requestBodyProperties[prop] as XSchemaObject<any>;
      const args = schema[VALIDATION_ARGS] || [];
      const required = schema[IS_REQUIRED] || false;
      const value = this.req.body[prop];
      this.checkParamsOrBody('body', schema, prop, value, required, args);
    }
  }

  protected checkParamsOrBody(
    paramIn: ParamIn,
    schema: XSchemaObject,
    propertyName: string,
    value: any,
    required: boolean | undefined,
    args: any
  ) {
    if (schema.type == 'number') {
      if (required) {
        this.assert.number(propertyName, value, schema.minimum, schema.maximum, ...args);
      } else {
        this.assert.optionalNumber(propertyName, value, schema.minimum, schema.maximum, ...args);
      }
      if (value !== undefined) {
        this.coerceType(paramIn, propertyName, +value);
      }
    } else if (schema.type == 'string') {
      if (required) {
        this.assert.string(propertyName, value, schema.minLength, schema.maxLength, ...args);
      } else {
        this.assert.optionalString(propertyName, value, schema.minLength, schema.maxLength, ...args);
      }

      if (schema.pattern) {
        this.assert.pattern(propertyName, value, schema.pattern, ...args);
      }

      if (value !== undefined) {
        this.coerceType(paramIn, propertyName, `${value}`);
      }
    } else if (schema.type == 'boolean') {
      if (required) {
        this.assert.boolean(propertyName, value, ...args);
      } else {
        this.assert.optionalBoolean(propertyName, value, ...args);
      }

      if (value !== undefined) {
        this.coerceType(paramIn, propertyName, this.assert.convertToBool(value));
      }
    } else if (schema.type == 'object') {
      if (required) {
        this.assert.object(propertyName, value, ...args);
      } else {
        this.assert.optionalObject(propertyName, value, ...args);
      }

      for (const propertyName2 in schema.properties) {
        const schema2 = schema.properties[propertyName2];
        const value2 = value?.[propertyName2];
        const required2 = schema2[IS_REQUIRED];
        const args2 = schema2[VALIDATION_ARGS] || [];
        // @todo Check how it's works with circular refereces
        this.checkParamsOrBody(paramIn, schema2, propertyName2, value2, required2, args2);
      }
    } else if (schema.type == 'array') {
      if (required) {
        this.assert.array(propertyName, value, schema.minItems, schema.maxItems, ...args);
      } else {
        this.assert.optionalArray(propertyName, value, schema.minItems, schema.maxItems, ...args);
      }

      if (Array.isArray(schema.items)) {
        schema.items.forEach((schema2, i) => {
          const value2 = value?.[i];
          const required2 = schema2[IS_REQUIRED];
          const args2 = schema2[VALIDATION_ARGS] || [];
          // @todo Check how it's works with circular refereces
          this.checkParamsOrBody(paramIn, schema2, `${propertyName}[${i}]`, value2, required2, args2);
        });
      } else if (typeof schema.items == 'object') {
        const schema2 = schema.items;
        ((value as any[]) || []).forEach((value2, i) => {
          const required2 = schema2[IS_REQUIRED];
          const args2 = schema2[VALIDATION_ARGS] || [];
          // @todo Check how it's works with circular refereces
          this.checkParamsOrBody(paramIn, schema2, `${propertyName}[${i}]`, value2, required2, args2);
        });
      }
    }
  }
}
