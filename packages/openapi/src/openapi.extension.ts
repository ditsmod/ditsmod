import { Injectable, ReflectiveInjector } from '@ts-stack/di';
import { edk, Logger } from '@ditsmod/core';

import { PreRoutes } from './pre-routes';

@Injectable()
export class OpenapiExtension implements edk.Extension {
  constructor(protected injectorPerApp: ReflectiveInjector, private log: Logger) {}

  async init(prefixPerApp: string, extensionsMap: edk.ExtensionsMap) {
    extensionsMap.forEach((extensionsMetadata) => {
      const preRoutes = this.injectorPerApp.resolveAndInstantiate(PreRoutes) as PreRoutes;
      const oasRoutesData = preRoutes.getRoutesData(extensionsMetadata);
      this.log.info(oasRoutesData);
    });

    this.log.info('OpenApiExtension inited');
  }
}
