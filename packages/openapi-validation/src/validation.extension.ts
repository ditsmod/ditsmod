import { Extension, ExtensionManager, injectable, optional } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, RestRouteExtension } from '@ditsmod/rest';
import { isReferenceObject } from '@ditsmod/openapi';

import { ValidationRouteMeta } from './types.js';
import { ParametersInterceptor } from './parameters.interceptor.js';
import { AjvService } from './ajv.service.js';
import { ValidationOptions } from './validation-options.js';
import { RequestBodyInterceptor } from './request-body.interceptor.js';

@injectable()
export class ValidationExtension implements Extension<void> {
  constructor(
    protected extensionManager: ExtensionManager,
    protected ajvService: AjvService,
    @optional() private validationOptions?: ValidationOptions,
  ) {}

  async stage1() {
    await this.filterParameters();
  }

  protected async filterParameters() {
    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension);

    extensionGroupMeta.groupData.forEach((routeExtensionMeta) => {
      const { controllersMeta } = routeExtensionMeta;
      const { providersPerMod } = routeExtensionMeta.normalizedModuleMeta;
      providersPerMod.push({ token: AjvService, useValue: this.ajvService });

      controllersMeta.forEach(({ providersPerReq, routeMeta }) => {
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
          routeExtensionMeta.meta.providersPerReq.unshift(ParametersInterceptor);
          providersPerReq.push({
            token: HTTP_INTERCEPTORS,
            useToken: ParametersInterceptor,
            multi: true,
          });
        }
        if (validationRouteMeta.requestBodySchema) {
          routeExtensionMeta.meta.providersPerReq.unshift(RequestBodyInterceptor);
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
