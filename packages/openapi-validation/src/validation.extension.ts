import { Extension, ExtensionsManager, HTTP_INTERCEPTORS, PerAppService, injectable, optional } from '@ditsmod/core';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';
import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';
import { isReferenceObject } from '@ditsmod/openapi';

import { ValidationRouteMeta } from './types.js';
import { ParametersInterceptor } from './parameters.interceptor.js';
import { AjvService } from './ajv.service.js';
import { ValidationOptions } from './validation-options.js';
import { RequestBodyInterceptor } from './request-body.interceptor.js';

@injectable()
export class ValidationExtension implements Extension<void> {
  private inited: boolean;

  constructor(
    protected perAppService: PerAppService,
    protected extensionsManager: ExtensionsManager,
    protected ajvService: AjvService,
    @optional() private validationOptions?: ValidationOptions,
  ) {}

  async stage1() {
    if (this.inited) {
      return;
    }

    await this.extensionsManager.stage1(BODY_PARSER_EXTENSIONS);
    await this.filterParameters();
    this.inited = true;
  }

  protected async filterParameters() {
    const totalStage1Meta = await this.extensionsManager.stage1(ROUTES_EXTENSIONS);

    totalStage1Meta.aExtStage1Meta.forEach((stage1Meta) => {
      const { aControllerMetadata } = stage1Meta.payload;
      const { providersPerMod } = stage1Meta.payload.meta;
      providersPerMod.push({ token: AjvService, useValue: this.ajvService });

      aControllerMetadata.forEach(({ providersPerReq, routeMeta }) => {
        const validationRouteMeta = routeMeta as ValidationRouteMeta;
        validationRouteMeta.parameters = [];
        if (validationRouteMeta.operationObject?.parameters?.length) {
          validationRouteMeta.operationObject.parameters.forEach((p) => {
            if (!isReferenceObject(p)) {
              if (!p.schema) {
                p = { ...p, schema: { type: 'string' } };
              }
              this.ajvService.addValidator(p.schema!);
              validationRouteMeta.parameters.push(p);
            }
          });
        }

        const requestBody = validationRouteMeta.operationObject?.requestBody;
        if (!isReferenceObject(requestBody) && requestBody?.content?.['application/json']?.schema) {
          const { schema } = requestBody.content['application/json'];
          this.ajvService.addValidator(schema);
          validationRouteMeta.requestBodySchema = schema;
        }

        if (!validationRouteMeta.parameters.length && !validationRouteMeta.requestBodySchema) {
          return;
        }

        validationRouteMeta.options = this.validationOptions || new ValidationOptions();

        if (validationRouteMeta.parameters.length) {
          stage1Meta.payload.meta.providersPerReq.unshift(ParametersInterceptor);
          providersPerReq.push({
            token: HTTP_INTERCEPTORS,
            useToken: ParametersInterceptor,
            multi: true,
          });
        }
        if (validationRouteMeta.requestBodySchema) {
          stage1Meta.payload.meta.providersPerReq.unshift(RequestBodyInterceptor);
          providersPerReq.push({
            token: HTTP_INTERCEPTORS,
            useToken: RequestBodyInterceptor,
            multi: true,
          });
        }
      });
    });
  }
}
