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
import { Injectable, Optional } from '@ts-stack/di';

import { ValidationRouteMeta } from './types';
import { ParametersInterceptor } from './parameters.interceptor';
import { AjvService } from './ajv.service';
import { ValidationOptions } from './validation-options';
import { RequestBodyInterceptor } from './request-body.interceptor';

@Injectable()
export class ValidationExtension implements Extension<void> {
  private inited: boolean;

  constructor(
    private perAppService: PerAppService,
    private extensionsManager: ExtensionsManager,
    private ajvService: AjvService,
    @Optional() private validationOptions?: ValidationOptions
  ) {}

  async init(isLastExtensionCall?: boolean) {
    if (this.inited) {
      return;
    }

    await this.extensionsManager.init(BODY_PARSER_EXTENSIONS);
    await this.filterParameters();
    if (isLastExtensionCall) {
      this.perAppService.providers = [{ provide: AjvService, useValue: this.ajvService }];
    }
    this.inited = true;
  }

  protected async filterParameters() {
    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
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
        providersPerRou.push({ provide: ValidationRouteMeta, useExisting: RouteMeta });

        if (validationRouteMeta.parameters.length) {
          metadataPerMod2.providersPerReq.unshift(ParametersInterceptor);
          providersPerReq.push({
            provide: HTTP_INTERCEPTORS,
            useExisting: ParametersInterceptor,
            multi: true,
          });
        }
        if (validationRouteMeta.requestBodySchema) {
          metadataPerMod2.providersPerReq.unshift(RequestBodyInterceptor);
          providersPerReq.push({
            provide: HTTP_INTERCEPTORS,
            useExisting: RequestBodyInterceptor,
            multi: true,
          });
        }
      });
    });
  }
}
