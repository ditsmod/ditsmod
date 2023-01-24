import { AnyObj, fromSelf, inject, injectable, PATH_PARAMS, QUERY_PARAMS } from '@ditsmod/core';
import { CustomError } from '@ditsmod/core';
import { Cookies } from '@ts-stack/cookies';
import { XSchemaObject } from '@ts-stack/openapi-spec';

import { ValidationRouteMeta } from './types';
import { ValidationInterceptor } from './validation.interceptor';

/**
 * Interceptor to validate OpenAPI parameters in:
 * - path
 * - query
 * - cookie
 * - header
 */
@injectable()
export class ParametersInterceptor extends ValidationInterceptor {
  protected override prepareAndValidate() {
    const { parameters, options } = this.routeMeta as ValidationRouteMeta;
    for (const parameter of parameters) {
      const schema = parameter.schema as XSchemaObject<any>;
      let value: any;
      if (parameter.in == 'path') {
        const pathParams = this.injector.get(PATH_PARAMS, fromSelf);
        value = pathParams?.[parameter.name];
      } else if (parameter.in == 'query') {
        const queryParams = this.injector.get(QUERY_PARAMS, fromSelf);
        value = queryParams?.[parameter.name];
      } else if (parameter.in == 'cookie') {
        const cookies = new Cookies(this.nodeReq, this.nodeRes);
        value = cookies.get(parameter.name);
      } else if (parameter.in == 'header') {
        value = this.nodeReq.headers[parameter.name];
      }

      if (value === undefined) {
        if (parameter.required) {
          const dict = this.getDict();
          throw new CustomError({
            msg1: dict.missingRequiredParameter(parameter.name, parameter.in),
            status: options.invalidStatus,
          });
        }
        continue;
      }

      this.validate(schema, value, parameter.name);
    }
  }
}
