import {
  injectable,
  Injector,
  Extension,
  ExtensionsManager,
  PerAppService,
  Status,
  HttpMethod,
  Provider,
  Stage1ExtensionMetaPerApp,
} from '@ditsmod/core';
import { CorsOptions, mergeOptions } from '@ts-stack/cors';
import {
  RequestContext,
  ControllerMetadata,
  HTTP_INTERCEPTORS,
  MetadataPerMod3,
  RouteMeta,
  RoutesExtension,
} from '@ditsmod/rest';

import { CorsInterceptor } from './cors.interceptor.js';
import { ALLOW_METHODS } from './constans.js';

@injectable()
export class CorsExtension implements Extension<void | false> {
  private registeredPathForOptions = new Map<string, HttpMethod[]>();

  constructor(
    protected perAppService: PerAppService,
    private extensionsManager: ExtensionsManager,
  ) {}

  async stage1() {
    const stage1ExtensionMeta = await this.extensionsManager.stage1(RoutesExtension, this, true);
    if (stage1ExtensionMeta.delay) {
      return false;
    }
    this.prepareDataAndSetInterceptors(stage1ExtensionMeta.groupDataPerApp, this.perAppService.injector);

    return; // Make TypeScript happy
  }

  protected prepareDataAndSetInterceptors(
    groupDataPerApp: Stage1ExtensionMetaPerApp<MetadataPerMod3>[],
    injectorPerApp: Injector,
  ) {
    groupDataPerApp.forEach((stage1ExtensionMetaPerApp) => {
      stage1ExtensionMetaPerApp.groupData.forEach((metadataPerMod3) => {
        const { aControllerMetadata } = metadataPerMod3;
        const { providersPerMod } = metadataPerMod3.baseMeta;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const routesWithOptions = this.getRoutesWithOptions(
          providersPerMod,
          stage1ExtensionMetaPerApp.groupData,
          aControllerMetadata,
        );
        aControllerMetadata.push(...routesWithOptions);

        aControllerMetadata.forEach(({ providersPerReq, providersPerRou, scope }) => {
          const mergedPerRou = [...metadataPerMod3.meta.providersPerRou, ...providersPerRou];
          const corsOptions = this.getCorsOptions(injectorPerMod, mergedPerRou);
          const mergedCorsOptions = mergeOptions(corsOptions);
          providersPerRou.unshift({ token: CorsOptions, useValue: mergedCorsOptions });
          if (scope == 'ctx') {
            providersPerRou.push({ token: HTTP_INTERCEPTORS, useClass: CorsInterceptor, multi: true });
          } else {
            providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: CorsInterceptor, multi: true });
          }
        });
      });
    });
  }

  protected getCorsOptions(injectorPerMod: Injector, mergedPerRou: Provider[]) {
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
    const corsOptions = injectorPerRou.get(CorsOptions, undefined, {}) as CorsOptions;
    const clonedCorsOptions = { ...corsOptions };
    if (!clonedCorsOptions.allowedMethods?.length) {
      clonedCorsOptions.allowedMethods = injectorPerRou.get(ALLOW_METHODS, undefined, []) as HttpMethod[];
    }

    return clonedCorsOptions;
  }

  protected getPathWtihOptions(aMetadataPerMod3: MetadataPerMod3[]) {
    const sPathWithOptions = new Set<string>();

    aMetadataPerMod3.forEach((metadataPerMod3) => {
      metadataPerMod3.aControllerMetadata
        .filter(({ httpMethods }) => httpMethods.includes('OPTIONS'))
        .forEach(({ fullPath }) => sPathWithOptions.add(fullPath));
    });

    return sPathWithOptions;
  }

  protected getRoutesWithOptions(
    providersPerMod: Provider[],
    aMetadataPerMod3: MetadataPerMod3[],
    aControllerMetadata: ControllerMetadata[],
  ) {
    const sPathWithOptions = this.getPathWtihOptions(aMetadataPerMod3);
    const newArrControllersMetadata2: ControllerMetadata[] = []; // Routes with OPTIONS methods

    aControllerMetadata.forEach(({ httpMethods, fullPath }) => {
      httpMethods.forEach((method) => {
        // Search routes with non-OPTIONS methods, and makes new routes with OPTIONS methods
        if (sPathWithOptions.has(fullPath)) {
          return;
        }
        const methodName = Symbol(fullPath);
        const allowHttpMethods = this.registeredPathForOptions.get(fullPath) || [];
        if (allowHttpMethods.length) {
          allowHttpMethods.push(method);
          return;
        }
        allowHttpMethods.push('OPTIONS', method);
        this.registeredPathForOptions.set(fullPath, allowHttpMethods);

        class DynamicController {
          [methodName](ctx: RequestContext) {
            ctx.rawRes.statusCode = Status.NO_CONTENT;
            ctx.rawRes.setHeader('Allow', allowHttpMethods.join());
            ctx.rawRes.end();
          }
        }

        providersPerMod.unshift(DynamicController);

        const routeMeta: RouteMeta = {
          resolvedGuards: [],
          Controller: DynamicController,
          methodName,
        };

        const controllerMetadata: ControllerMetadata = {
          httpMethods: ['OPTIONS'],
          fullPath,
          providersPerRou: [
            { token: ALLOW_METHODS, useValue: allowHttpMethods },
            { token: RouteMeta, useValue: routeMeta },
          ],
          providersPerReq: [],
          routeMeta,
          scope: 'ctx',
          interceptors: [],
          guards: [],
        };

        newArrControllersMetadata2.push(controllerMetadata);
      });
    });

    return newArrControllersMetadata2;
  }
}
