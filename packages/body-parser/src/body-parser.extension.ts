import {
  BodyParserConfig,
  Extension,
  ExtensionsManager,
  HTTP_INTERCEPTORS,
  InjectorPerApp,
  RouteMeta,
  ROUTES_EXTENSIONS,
} from '@ditsmod/core';
import { Injectable, InjectionToken } from '@ts-stack/di';

import { BodyParserInterceptor } from './body-parser.interceptor';

export const BODY_PARSER_EXTENSIONS = new InjectionToken<Extension<void>[]>('BODY_PARSER_EXTENSIONS');

@Injectable()
export class BodyParserExtension implements Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: ExtensionsManager, protected injectorPerApp: InjectorPerApp) {}

  async init() {
    if (this.inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionManager.init(ROUTES_EXTENSIONS);
    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      aControllersMetadata2.forEach(({ providersPerRou, providersPerReq }) => {
        const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild([...metadataPerMod2.providersPerRou, ...providersPerRou]);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild([...metadataPerMod2.providersPerReq, ...providersPerReq]);
        const routeMeta = injectorPerRou.get(RouteMeta) as RouteMeta;
        const bodyParserConfig = injectorPerReq.resolveAndInstantiate(BodyParserConfig) as BodyParserConfig;
        if (bodyParserConfig.acceptMethods.includes(routeMeta.httpMethod)) {
          providersPerReq.push({ provide: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
        }
      });
    });

    this.inited = true;
  }
}
