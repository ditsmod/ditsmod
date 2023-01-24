import { injectable, CustomError } from '@ditsmod/core';
import { HTTP_BODY } from '@ditsmod/body-parser';

import { ValidationRouteMeta } from './types';
import { ValidationInterceptor } from './validation.interceptor';

/**
 * Interceptor to validate OpenAPI `requestBody`.
 */
@injectable()
export class RequestBodyInterceptor extends ValidationInterceptor {
  protected override prepareAndValidate() {
    const { options, requestBodySchema } = this.routeMeta as ValidationRouteMeta;
    const body = this.injector.get(HTTP_BODY);
    if (body === undefined) {
      const dict = this.getDict();
      throw new CustomError({
        msg1: dict.missingRequestBody,
        status: options.invalidStatus,
      });
    }

    this.validate(requestBodySchema, body);
  }
}
