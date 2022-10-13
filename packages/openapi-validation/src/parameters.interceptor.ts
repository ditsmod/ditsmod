import { Injectable } from '@ts-stack/di';
import { CustomError, Req } from '@ditsmod/core';
import { Cookies } from '@ts-stack/cookies';
import { XSchemaObject } from '@ts-stack/openapi-spec';

import { ValidationInterceptor } from './validation.interceptor';

/**
 * Interceptor to validate OpenAPI parameters in:
 * - path
 * - query
 * - cookie
 * - header
 */
@Injectable()
export class ParametersInterceptor extends ValidationInterceptor {
  protected override prepareAndValidate() {
    const { parameters } = this.meta;
    for (const parameter of parameters) {
      const schema = parameter.schema as XSchemaObject<any>;
      let value: any;
      const req = this.injector.get(Req);
      if (parameter.in == 'path') {
        value = req.pathParams[parameter.name];
      } else if (parameter.in == 'query') {
        value = req.queryParams[parameter.name];
      } else if (parameter.in == 'cookie') {
        const cookies = new Cookies(req.nodeReq, req.nodeRes);
        value = cookies.get(parameter.name);
      } else if (parameter.in == 'header') {
        value = req.nodeReq.headers[parameter.name];
      }

      if (value === undefined) {
        if (parameter.required) {
          const dict = this.getDict();
          throw new CustomError({
            msg1: dict.missingRequiredParameter(parameter.name, parameter.in),
            status: this.meta.options.invalidStatus,
          });
        }
        continue;
      }

      this.validate(schema, value, parameter.name);
    }
  }
}
