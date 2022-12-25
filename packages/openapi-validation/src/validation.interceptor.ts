import { injectable, Injector } from '@ts-stack/di';
import { HttpHandler, HttpInterceptor, Status, CustomError } from '@ditsmod/core';
import { XSchemaObject } from '@ts-stack/openapi-spec';
import { DictService } from '@ditsmod/i18n';

import { ValidationRouteMeta } from './types';
import { AssertDict } from './locales/current';
import { AjvService } from './ajv.service';

@injectable()
export class ValidationInterceptor implements HttpInterceptor {
  constructor(protected injector: Injector, protected meta: ValidationRouteMeta, protected ajvService: AjvService) {}

  intercept(next: HttpHandler) {
    this.prepareAndValidate();
    return next.handle();
  }

  protected prepareAndValidate() {}

  protected validate(schema: XSchemaObject, value: any, parameter?: string) {
    const validate = this.ajvService.getValidator(schema);
    if (!validate) {
      const dict = this.getDict();
      throw new CustomError({ msg2: dict.ajvSchemaNotFound, status: Status.INTERNAL_SERVER_ERROR, level: 'error' });
    }
    if (!validate(value)) {
      const msg1 = this.ajvService.ajv.errorsText(validate.errors);
      let args1: any;
      if (parameter) {
        args1 = { parameter };
      } else {
        args1 = validate.errors;
      }
      throw new CustomError({ msg1, args1, status: this.meta.options.invalidStatus });
    }
  }

  protected getDict() {
    const dictService: DictService = this.injector.get(DictService);
    return dictService.getDictionary(AssertDict);
  }
}
