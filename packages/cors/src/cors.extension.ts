import {
  injectable,
  Injector,
  Extension,
  ExtensionsManager,
  HTTP_INTERCEPTORS,
  RouteMeta,
  PerAppService,
  ControllerMetadata2,
  Status,
  HttpMethod,
  MetadataPerMod3,
  Provider,
  RequestContext,
  ExtensionInitMeta,
  TotalInitMetaPerApp,
} from '@ditsmod/core';
import { CorsOptions, mergeOptions } from '@ts-stack/cors';
import { ROUTES_EXTENSIONS } from '@ditsmod/routing';

import { CorsInterceptor } from './cors.interceptor.js';
import { ALLOW_METHODS } from './constans.js';

@injectable()
export class CorsExtension implements Extension<void | false> {
  private inited: boolean;
  private registeredPathForOptions = new Map<string, HttpMethod[]>();

  constructor(
    protected perAppService: PerAppService,
    private extensionsManager: ExtensionsManager,
  ) {}

  async init() {
    if (this.inited) {
      return;
    }

    const totalInitMeta = await this.extensionsManager.init(ROUTES_EXTENSIONS, true);
    if (totalInitMeta.delay) {
      return false;
    }
    this.prepareDataAndSetInterceptors(totalInitMeta.totalInitMetaPerApp, this.perAppService.injector);

    this.inited = true;
    return; // Make TypeScript happy
  }

  protected prepareDataAndSetInterceptors(
    totalInitMetaPerApp: TotalInitMetaPerApp<MetadataPerMod3>[],
    injectorPerApp: Injector,
  ) {
    totalInitMetaPerApp.forEach((totaInitMeta) => {
      totaInitMeta.groupInitMeta.forEach((initMeta) => {
        const metadataPerMod3 = initMeta.payload;
        const { aControllersMetadata2, providersPerMod } = metadataPerMod3;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const routesWithOptions = this.getRoutesWithOptions(totaInitMeta.groupInitMeta, aControllersMetadata2);
        aControllersMetadata2.push(...routesWithOptions);

        aControllersMetadata2.forEach(({ providersPerReq, providersPerRou, isSingleton }) => {
          const mergedPerRou = [...metadataPerMod3.providersPerRou, ...providersPerRou];
          const corsOptions = this.getCorsOptions(injectorPerMod, mergedPerRou);
          const mergedCorsOptions = mergeOptions(corsOptions);
          providersPerRou.unshift({ token: CorsOptions, useValue: mergedCorsOptions });
          if (isSingleton) {
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

  protected getPathWtihOptions(groupInitMeta: ExtensionInitMeta<MetadataPerMod3>[]) {
    const sPathWithOptions = new Set<string>();

    groupInitMeta.forEach((initMeta) => {
      const metadataPerMod3 = initMeta.payload;
      metadataPerMod3.aControllersMetadata2
        .filter(({ httpMethod }) => httpMethod == 'OPTIONS')
        .forEach(({ path }) => sPathWithOptions.add(path));
    });

    return sPathWithOptions;
  }

  protected getRoutesWithOptions(
    groupInitMeta: ExtensionInitMeta<MetadataPerMod3>[],
    aControllersMetadata2: ControllerMetadata2[],
  ) {
    const sPathWithOptions = this.getPathWtihOptions(groupInitMeta);
    const newArrControllersMetadata2: ControllerMetadata2[] = []; // Routes with OPTIONS methods

    aControllersMetadata2.forEach(({ httpMethod, path }) => {
      // Search routes with non-OPTIONS methods, and makes new routes with OPTIONS methods
      if (sPathWithOptions.has(path)) {
        return;
      }
      const methodName = Symbol(path);
      const httpMethods = this.registeredPathForOptions.get(path) || [];
      if (httpMethods.length) {
        httpMethods.push(httpMethod);
        return;
      }
      httpMethods.push('OPTIONS', httpMethod);
      this.registeredPathForOptions.set(path, httpMethods);

      class DynamicController {
        [methodName](ctx: RequestContext) {
          ctx.setHeader('Allow', httpMethods.join()).send(undefined, Status.NO_CONTENT);
        }
      }

      const routeMeta: RouteMeta = {
        decoratorAndValue: {} as any,
        resolvedGuards: [],
        controller: DynamicController,
        methodName,
      };

      const controllersMetadata2: ControllerMetadata2 = {
        httpMethod: 'OPTIONS',
        path,
        providersPerRou: [
          { token: ALLOW_METHODS, useValue: httpMethods },
          { token: RouteMeta, useValue: routeMeta },
        ],
        providersPerReq: [],
        routeMeta,
        isSingleton: true,
        guards: [],
        guardsPerMod1: [],
      };

      newArrControllersMetadata2.push(controllersMetadata2);
    });

    return newArrControllersMetadata2;
  }
}
