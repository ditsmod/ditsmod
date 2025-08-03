import { Extension, ExtensionsManager, PerAppService, injectable } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, RoutesExtension } from '@ditsmod/rest';

import { BodyParserConfig } from './body-parser-config.js';
import { BodyParserInterceptor } from './body-parser.interceptor.js';
import { CtxBodyParserInterceptor } from './ctx-body-parser.interceptor.js';

@injectable()
export class BodyParserExtension implements Extension<void> {
  constructor(
    protected extensionManager: ExtensionsManager,
    protected perAppService: PerAppService,
  ) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionManager.stage1(RoutesExtension);
    stage1ExtensionMeta.groupData.forEach((metadataPerMod3) => {
      const { aControllerMetadata } = metadataPerMod3;
      const { providersPerMod } = metadataPerMod3.baseMeta;
      aControllerMetadata.forEach(({ providersPerRou, providersPerReq, httpMethods, scope }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...metadataPerMod3.meta.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...metadataPerMod3.meta.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerApp = this.perAppService.injector;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        httpMethods.forEach((method) => {
          if (scope == 'ctx') {
            let bodyParserConfig = injectorPerRou.get(BodyParserConfig, undefined, {}) as BodyParserConfig;
            bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
            if (bodyParserConfig.acceptMethods!.includes(method)) {
              providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: CtxBodyParserInterceptor, multi: true });
            }
          } else {
            const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);
            let bodyParserConfig = injectorPerReq.get(BodyParserConfig, undefined, {}) as BodyParserConfig;
            bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
            if (bodyParserConfig.acceptMethods!.includes(method)) {
              providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
            }
          }
        });
      });
    });
  }
}
