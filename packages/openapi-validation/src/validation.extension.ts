import { Extension, ExtensionsManager, HTTP_INTERCEPTORS, RouteMeta, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { BODY_PARSER_EXTENSIONS } from '@ditsmod/body-parser';
import { isReferenceObject, OasRouteMeta } from '@ditsmod/openapi';
import { Injectable, ReflectiveInjector } from '@ts-stack/di';

import { ValidationRouteMeta } from './types';
import { ValidationInterceptor } from './validation.interceptor';

@Injectable()
export class ValidationExtension implements Extension<void> {
  private inited: boolean;

  constructor(private injectorPerApp: ReflectiveInjector, private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    await this.extensionsManager.init(BODY_PARSER_EXTENSIONS);
    await this.filterParameters();
    this.inited = true;
  }

  protected async filterParameters() {
    const metadataPerMod2Arr = await this.extensionsManager.init(ROUTES_EXTENSIONS);

    metadataPerMod2Arr.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);

      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
        const validationRouteMeta = injectorPerRou.get(OasRouteMeta) as ValidationRouteMeta;
        validationRouteMeta.parameters = [];
        if (validationRouteMeta.operationObject?.parameters?.length) {
          validationRouteMeta.operationObject.parameters.forEach((p) => {
            if (!isReferenceObject(p) && p.schema) {
              validationRouteMeta.parameters.push(p);
            }
          });
        }

        const requestBody = validationRouteMeta.operationObject?.requestBody;
        if (
          requestBody &&
          !isReferenceObject(requestBody) &&
          requestBody.content?.['application/json']?.schema?.properties
        ) {
          validationRouteMeta.requestBodyProperties = requestBody.content['application/json'].schema.properties;
        }

        if (validationRouteMeta.parameters.length || validationRouteMeta.requestBodyProperties) {
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
