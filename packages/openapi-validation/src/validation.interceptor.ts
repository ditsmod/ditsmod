import { Injectable } from '@ts-stack/di';
import { HttpHandler, HttpInterceptor, Req, Status, CustomError } from '@ditsmod/core';
import { Cookies } from '@ts-stack/cookies';
import { XSchemaObject } from '@ts-stack/openapi-spec';
import { DictService } from '@ditsmod/i18n';

import { ValidationRouteMeta } from './types';
import { AssertDict } from './locales/current';
import { AjvService } from './ajv.service';

@Injectable()
export class ValidationInterceptor implements HttpInterceptor {
  constructor(private req: Req, private validationMeta: ValidationRouteMeta, private ajvService: AjvService) {}

  intercept(next: HttpHandler) {
    this.validateParams();
    this.validateRequestBody();
    return next.handle();
  }

  protected validateParams() {
    const { parameters } = this.validationMeta;
    for (const parameter of parameters) {
      const schema = parameter.schema as XSchemaObject<any>;
      let value: any;
      if (parameter.in == 'path') {
        value = this.req.pathParams[parameter.name];
      } else if (parameter.in == 'query') {
        value = this.req.queryParams[parameter.name];
      } else if (parameter.in == 'cookie') {
        const cookies = new Cookies(this.req.nodeReq, this.req.nodeRes);
        value = cookies.get(parameter.name);
      } else if (parameter.in == 'header') {
        value = this.req.nodeReq.headers[parameter.name];
      }

      if (value === undefined) {
        if (parameter.required) {
          const dict = this.getDict();
          throw new CustomError({
            msg1: dict.missingRequiredParameter(parameter.name, parameter.in),
            status: Status.BAD_REQUEST,
          });
        }
        return;
      }

      this.validate(schema, value);
    }
  }

  protected validateRequestBody() {
    if (!this.validationMeta.requestBodySchema) {
      return;
    }

    if (this.req.body === undefined) {
      const dict = this.getDict();
      throw new CustomError({ msg1: dict.missingRequestBody, status: Status.BAD_REQUEST });
    }

    this.validate(this.validationMeta.requestBodySchema, this.req.body);
  }

  protected validate(schema: XSchemaObject, value: any) {
    const validate = this.ajvService.getValidator(schema);
    if (!validate) {
      const dict = this.getDict();
      throw new CustomError({ msg2: dict.ajvSchemaNotFound, status: Status.INTERNAL_SERVER_ERROR, level: 'error' });
    }
    if (!validate(value)) {
      const msg1 = this.ajvService.ajv.errorsText(validate.errors);
      throw new CustomError({ msg1, status: Status.BAD_REQUEST });
    }
  }

  protected getDict() {
    const dictService: DictService = this.req.injector.get(DictService);
    return dictService.getDictionary(AssertDict);
  }
}
