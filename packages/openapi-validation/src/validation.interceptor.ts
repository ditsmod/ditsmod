import { injectable, Injector, skipSelf, Status, CustomError } from '@ditsmod/core';
import { XSchemaObject } from '@ts-stack/openapi-spec';
import { DictService } from '@ditsmod/i18n';
import { RawRequest, RawResponse, RequestContext, HttpHandler, HttpInterceptor, RouteMeta } from '@ditsmod/rest';

import { ValidationRouteMeta } from './types.js';
import { AssertDict } from './locales/current/_base-en/assert.dict.js';
import { AjvService } from './ajv.service.js';

@injectable()
export class ValidationInterceptor implements HttpInterceptor {
  protected rawReq: RawRequest;
  protected rawRes: RawResponse;

  constructor(
    protected injector: Injector,
    protected ajvService: AjvService,
    @skipSelf() protected routeMeta: RouteMeta,
  ) {}

  intercept(next: HttpHandler, ctx: RequestContext) {
    this.rawReq = ctx.rawReq;
    this.rawRes = ctx.rawRes;
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
      const validationRouteMeta = this.routeMeta as ValidationRouteMeta;
      throw new CustomError({ msg1, args1, status: validationRouteMeta.options.invalidStatus, level: 'debug' });
    }
  }

  protected getDict() {
    const dictService: DictService = this.injector.get(DictService);
    return dictService.getDictionary(AssertDict);
  }
}
