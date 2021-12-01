import { BodyParserConfig, edk, HTTP_INTERCEPTORS } from '@ditsmod/core';
import { Injectable, InjectionToken } from '@ts-stack/di';

import { BodyParserInterceptor } from './body-parser.interceptor';

export const BODY_PARSER_EXTENSIONS = new InjectionToken<edk.Extension<void>[]>('BODY_PARSER_EXTENSIONS');

@Injectable()
export class BodyParserExtension implements edk.Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: edk.ExtensionsManager, protected injectorPerApp: edk.InjectorPerApp) {}

  async init() {
    if (this.inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionManager.init(edk.ROUTES_EXTENSIONS);
    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aMetaForExtensionsPerRou, providersPerMod } = metadataPerMod2;
      aMetaForExtensionsPerRou.forEach(({ providersPerRou, providersPerReq }) => {
        const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
        const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
        const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
        const routeMeta = injectorPerRou.get(edk.RouteMeta) as edk.RouteMeta;
        const bodyParserConfig = injectorPerReq.resolveAndInstantiate(BodyParserConfig) as BodyParserConfig;
        if (bodyParserConfig.acceptMethods.includes(routeMeta.httpMethod)) {
          providersPerReq.push({ provide: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
        }
      });
    });

    this.inited = true;
  }
}
