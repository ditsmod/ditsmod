import { Extension, ExtensionManager, Injector, injectable, inject, PROVIDERS_PER_APP } from '@ditsmod/core';
import { HTTP_INTERCEPTORS, RestRouteExtension } from '@ditsmod/rest';

import { BodyParserConfig } from './body-parser-config.js';
import { BodyParserInterceptor } from './body-parser.interceptor.js';
import { RouteScopedBodyParserInterceptor } from './ctx-body-parser.interceptor.js';
import type { Provider } from '@ditsmod/core/di';

@injectable()
export class BodyParserExtension implements Extension<void> {
  constructor(
    protected extensionManager: ExtensionManager,
    @inject(PROVIDERS_PER_APP) protected providersPerApp: Provider[],
  ) {}

  async stage1() {
    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension);
    extensionGroupMeta.groupData.forEach((routeExtensionMeta) => {
      const { aControllerMetadata } = routeExtensionMeta;
      const { providersPerMod } = routeExtensionMeta.normalizedModuleMeta;
      aControllerMetadata.forEach(({ providersPerRou, providersPerReq, httpMethods, scope }) => {
        // Merging the providers from a module and a controller
        const mergedProvidersPerRou = [...routeExtensionMeta.meta.providersPerRou, ...providersPerRou];
        const mergedProvidersPerReq = [...routeExtensionMeta.meta.providersPerReq, ...providersPerReq];

        // Creating a hierarchy of injectors.
        const injectorPerApp = Injector.resolveAndCreate(this.providersPerApp, 'App');
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedProvidersPerRou);
        httpMethods.forEach((method) => {
          if (scope == 'route') {
            let bodyParserConfig = injectorPerRou.get(BodyParserConfig, {}) as BodyParserConfig;
            bodyParserConfig = { ...new BodyParserConfig(), ...bodyParserConfig }; // Merge with default.
            if (bodyParserConfig.acceptMethods!.includes(method)) {
              providersPerRou.push({
                token: HTTP_INTERCEPTORS,
                useClass: RouteScopedBodyParserInterceptor,
                multi: true,
              });
            }
          } else {
            const injectorPerReq = injectorPerRou.resolveAndCreateChild(mergedProvidersPerReq);
            let bodyParserConfig = injectorPerReq.get(BodyParserConfig, {}) as BodyParserConfig;
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
