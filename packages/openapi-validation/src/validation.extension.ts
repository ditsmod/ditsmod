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
import { ValidationInterceptor } from './validation.interceptor';
import { AjvService } from './ajv.service';
import { ValidationOptions } from './validation-options';

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
    const metadataPerMod2Arr = await this.extensionsManager.init(ROUTES_EXTENSIONS);

    metadataPerMod2Arr.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      const injectorPerMod = this.perAppService.injector.resolveAndCreateChild(providersPerMod);

      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
        const validationRouteMeta = injectorPerRou.get(OasRouteMeta) as ValidationRouteMeta;
        validationRouteMeta.parameters = [];
        if (validationRouteMeta.operationObject?.parameters?.length) {
          validationRouteMeta.operationObject.parameters.forEach((p) => {
            if (!isReferenceObject(p) && p.schema) {
              this.ajvService.addValidator(p.schema);
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
        
        if (validationRouteMeta.parameters.length || validationRouteMeta.requestBodySchema) {
          validationRouteMeta.options = this.validationOptions || new ValidationOptions();
          providersPerRou.push({ provide: ValidationRouteMeta, useExisting: RouteMeta });
          providersPerReq.push({
            provide: HTTP_INTERCEPTORS,
            useClass: ValidationInterceptor,
            multi: true,
          });
        }
      });
    });
  }
}
