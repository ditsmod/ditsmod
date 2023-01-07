import { injectable, RequestContext } from '@ditsmod/core';
import { CustomError } from '@ditsmod/core';

import { ValidationRouteMeta } from './types';
import { ValidationInterceptor } from './validation.interceptor';

/**
 * Interceptor to validate OpenAPI `requestBody`.
 */
@injectable()
export class RequestBodyInterceptor extends ValidationInterceptor {
  protected override prepareAndValidate() {
    const { options, requestBodySchema } = this.ctx.routeMeta as ValidationRouteMeta;
    const { req } = this.ctx;
    if (req.body === undefined) {
      const dict = this.getDict();
      throw new CustomError({
        msg1: dict.missingRequestBody,
        status: options.invalidStatus,
      });
    }

    this.validate(requestBodySchema, req.body);
  }
}
