import { Injectable } from '@ts-stack/di';
import { CustomError } from '@ditsmod/core';

import { ValidationInterceptor } from './validation.interceptor';

/**
 * Interceptor to validate OpenAPI `requestBody`.
 */
@Injectable()
export class RequestBodyInterceptor extends ValidationInterceptor {
  protected override prepareAndValidate() {
    if (this.req.body === undefined) {
      const dict = this.getDict();
      throw new CustomError({
        msg1: dict.missingRequestBody,
        status: this.meta.options.invalidStatus,
      });
    }

    this.validate(this.meta.requestBodySchema, this.req.body);
  }
}
