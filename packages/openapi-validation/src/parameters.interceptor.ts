import { fromSelf, injectable, RequestContext } from '@ditsmod/core';
import { CustomError, Req } from '@ditsmod/core';
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
  protected override prepareAndValidate(ctx: RequestContext) {
    const { parameters, options } = ctx.routeMeta as ValidationRouteMeta;
    for (const parameter of parameters) {
      const schema = parameter.schema as XSchemaObject<any>;
      let value: any;
      const { req } = ctx;
      if (parameter.in == 'path') {
        value = req.pathParams[parameter.name];
      } else if (parameter.in == 'query') {
        value = req.queryParams[parameter.name];
      } else if (parameter.in == 'cookie') {
        const cookies = new Cookies(req.nodeReq, ctx.nodeRes);
        value = cookies.get(parameter.name);
      } else if (parameter.in == 'header') {
        value = req.nodeReq.headers[parameter.name];
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

      this.validate(ctx, schema, value, parameter.name);
    }
  }
}
