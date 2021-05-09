import { BodyParserConfig, edk } from '@ditsmod/core';
import { Injectable, ReflectiveInjector } from '@ts-stack/di';

@Injectable()
export class BodyParserExtension implements edk.Extension<void> {
  private inited: boolean;

  constructor(protected extensionManager: edk.ExtensionsManager, protected injectorPerApp: ReflectiveInjector) {}

  async init() {
    if (this.inited) {
      return;
    }

    const rawRouteMeta = await this.extensionManager.init(edk.ROUTES_EXTENSIONS);
    rawRouteMeta.forEach(meta => {
      const { providersPerMod, providersPerRou, providersPerReq } = meta;
      const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
      const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
      const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
      const routeMeta = injectorPerRou.get(edk.RouteMeta) as edk.RouteMeta;
      const route = routeMeta.decoratorMetadata.value as edk.RouteMeta;
      const bodyParserConfig = injectorPerReq.resolveAndInstantiate(BodyParserConfig) as BodyParserConfig;
      routeMeta.parseBody = bodyParserConfig.acceptMethods.includes(route.httpMethod);
    });

    this.inited = true;
  }
}