import { Injectable } from '@ts-stack/di';
import { Extension, ExtensionsManager, HTTP_INTERCEPTORS, ROUTES_EXTENSIONS } from '@ditsmod/core';
import { CorsOptions } from '@ts-stack/cors';
import { Optional } from '@ts-stack/di';

import { initCors } from './init-cors';
import { CorsInterceptor } from './cors.interceptor';
import { MergedCorsOptions } from './merged-cors-options';

@Injectable()
export class CorsExtension implements Extension<void> {
  private inited: boolean;

  constructor(private extensionsManager: ExtensionsManager) {}

  async init() {
    if (this.inited) {
      return;
    }

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS);

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2 } = metadataPerMod2;

      aControllersMetadata2.forEach(({ providersPerReq, providersPerRou }) => {
        providersPerRou.unshift({
          provide: MergedCorsOptions,
          useFactory: initCors,
          deps: [[CorsOptions, new Optional()]],
        });

        providersPerReq.push({
          provide: HTTP_INTERCEPTORS,
          useClass: CorsInterceptor,
          multi: true,
        });
      });
    });

    this.inited = true;
  }
}
