import { BodyParserConfig, edk, HTTP_INTERCEPTORS } from '@ditsmod/core';
import { Injectable, InjectionToken, ReflectiveInjector } from '@ts-stack/di';

import { BodyParserInterceptor } from './body-parser.interceptor';

export const BODY_PARSER_EXTENSIONS = new InjectionToken<edk.Extension<void>[]>('BODY_PARSER_EXTENSIONS');

@Injectable()
export class BodyParserExtension implements edk.Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: edk.ExtensionsManager, protected injectorPerApp: ReflectiveInjector) {}

  async init() {
    if (this.inited) {
      return;
    }

    const rawRouteMeta = await this.extensionManager.init(edk.ROUTES_EXTENSIONS);
    rawRouteMeta.forEach((meta) => {
      const { providersPerMod, providersPerRou, providersPerReq } = meta;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
      const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
      const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
      const routeMeta = injectorPerRou.get(edk.RouteMeta) as edk.RouteMeta;
      const bodyParserConfig = injectorPerReq.resolveAndInstantiate(BodyParserConfig) as BodyParserConfig;
      if (bodyParserConfig.acceptMethods.includes(routeMeta.httpMethod)) {
        providersPerReq.push({ provide: HTTP_INTERCEPTORS, useClass: BodyParserInterceptor, multi: true });
      }
    });

    this.inited = true;
  }
}
