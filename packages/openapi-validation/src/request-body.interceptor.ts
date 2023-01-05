import { injectable, RequestContext } from '@ditsmod/core';
import { CustomError, Req } from '@ditsmod/core';

import { ValidationRouteMeta } from './types';
import { ValidationInterceptor } from './validation.interceptor';

/**
 * Interceptor to validate OpenAPI `requestBody`.
 */
@injectable()
export class RequestBodyInterceptor extends ValidationInterceptor {
  protected override prepareAndValidate(ctx: RequestContext) {
    const { options, requestBodySchema } = ctx.routeMeta as ValidationRouteMeta;
    const req = this.injector.get(Req);
    if (req.body === undefined) {
      const dict = this.getDict();
      throw new CustomError({
        msg1: dict.missingRequestBody,
        status: options.invalidStatus,
      });
    }

    this.validate(ctx, requestBodySchema, req.body);
  }
}
