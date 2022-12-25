import {
  Extension,
  ExtensionsManager,
  HTTP_INTERCEPTORS,
  PerAppService,
  RouteMeta,
  ROUTES_EXTENSIONS,
} from '@ditsmod/core';
import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';
import { isReferenceObject, OasRouteMeta } from '@ditsmod/openapi';
import { injectable, optional } from '@ts-stack/di';

import { ValidationRouteMeta } from './types';
import { ParametersInterceptor } from './parameters.interceptor';
import { AjvService } from './ajv.service';
import { ValidationOptions } from './validation-options';
import { RequestBodyInterceptor } from './request-body.interceptor';

@injectable()
export class ValidationExtension implements Extension<void> {
  private inited: boolean;

  constructor(
    private perAppService: PerAppService,
    private extensionsManager: ExtensionsManager,
    private ajvService: AjvService,
    @optional() private validationOptions?: ValidationOptions
  ) {}

  async init() {
    if (this.inited) {
      return;
    }

    await this.extensionsManager.init(BODY_PARSER_EXTENSIONS);
    await this.filterParameters();
    this.inited = true;
  }

  protected async filterParameters() {
    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      providersPerMod.push({ token: AjvService, useValue: this.ajvService });
      const injectorPerMod = this.perAppService.injector.resolveAndCreateChild(providersPerMod);

      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
        const validationRouteMeta = injectorPerRou.get(OasRouteMeta) as ValidationRouteMeta;
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
        providersPerRou.push({ token: ValidationRouteMeta, useToken: RouteMeta });

        if (validationRouteMeta.parameters.length) {
          metadataPerMod2.providersPerReq.unshift(ParametersInterceptor);
          providersPerReq.push({
            token: HTTP_INTERCEPTORS,
            useToken: ParametersInterceptor,
            multi: true,
          });
        }
        if (validationRouteMeta.requestBodySchema) {
          metadataPerMod2.providersPerReq.unshift(RequestBodyInterceptor);
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
