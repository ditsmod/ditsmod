import { Injectable } from '@ts-stack/di';
import { CustomError, Req } from '@ditsmod/core';

import { ValidationInterceptor } from './validation.interceptor';

/**
 * Interceptor to validate OpenAPI `requestBody`.
 */
@Injectable()
export class RequestBodyInterceptor extends ValidationInterceptor {
  protected override prepareAndValidate() {
    const req = this.injector.get(Req);
    if (req.body === undefined) {
      const dict = this.getDict();
      throw new CustomError({
        msg1: dict.missingRequestBody,
        status: this.meta.options.invalidStatus,
      });
    }

    this.validate(this.meta.requestBodySchema, req.body);
  }
}
