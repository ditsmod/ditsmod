import { injectable } from '@ditsmod/core';
import { CustomError, Req } from '@ditsmod/core';

import { ValidationRouteMeta } from './types';
import { ValidationInterceptor } from './validation.interceptor';

/**
 * Interceptor to validate OpenAPI `requestBody`.
 */
@injectable()
export class RequestBodyInterceptor extends ValidationInterceptor {
  protected override prepareAndValidate(routeMeta: ValidationRouteMeta) {
    const req = this.injector.get(Req);
    if (req.body === undefined) {
      const dict = this.getDict();
      throw new CustomError({
        msg1: dict.missingRequestBody,
        status: routeMeta.options.invalidStatus,
      });
    }

    this.validate(routeMeta, routeMeta.requestBodySchema, req.body);
  }
}
