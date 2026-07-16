import { injectable } from '@ditsmod/core';
import { CustomError } from '@ditsmod/core/errors';
import { HTTP_BODY } from '@ditsmod/body-parser';

import { ValidationRouteMeta } from './types.js';
import { ValidationInterceptor } from './validation.interceptor.js';

/**
 * Interceptor to validate OpenAPI `requestBody`.
 */
@injectable()
export class RequestBodyInterceptor extends ValidationInterceptor {
  protected override prepareAndValidate() {
    const { options, requestBodySchema } = this.routeMeta as ValidationRouteMeta;
    const body = this.ctx.get(HTTP_BODY);
    if (body === undefined) {
      throw new CustomError({
        msg1: 'Missing request body',
        status: options.invalidStatus,
      });
    }

    this.validate(requestBodySchema, body);
  }
}
