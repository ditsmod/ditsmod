import {
  injectable,
  Injector,
  Extension,
  ExtensionsManager,
  HTTP_INTERCEPTORS,
  RouteMeta,
  PerAppService,
  ControllerMetadata,
  Status,
  HttpMethod,
  Provider,
  RequestContext,
  ExtensionStage1Meta,
  TotalStage1MetaPerApp,
} from '@ditsmod/core';
import { CorsOptions, mergeOptions } from '@ts-stack/cors';
import { MetadataPerMod3, ROUTES_EXTENSIONS } from '@ditsmod/routing';

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

  async stage1() {
    if (this.inited) {
      return;
    }

    const totalStage1Meta = await this.extensionsManager.stage1(ROUTES_EXTENSIONS, true);
    if (totalStage1Meta.delay) {
      return false;
    }
    this.prepareDataAndSetInterceptors(totalStage1Meta.totalStage1MetaPerApp, this.perAppService.injector);

    this.inited = true;
    return; // Make TypeScript happy
  }

  protected prepareDataAndSetInterceptors(
    totalStage1MetaPerApp: TotalStage1MetaPerApp<MetadataPerMod3>[],
    injectorPerApp: Injector,
  ) {
    totalStage1MetaPerApp.forEach((totaStage1Meta) => {
      totaStage1Meta.groupStage1Meta.forEach((stage1Meta) => {
        const metadataPerMod3 = stage1Meta.payload;
        const { aControllerMetadata } = metadataPerMod3;
        const { providersPerMod } = metadataPerMod3.meta;
        const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
        const routesWithOptions = this.getRoutesWithOptions(totaStage1Meta.groupStage1Meta, aControllerMetadata);
        aControllerMetadata.push(...routesWithOptions);

        aControllerMetadata.forEach(({ providersPerReq, providersPerRou, singletonPerScope }) => {
          const mergedPerRou = [...metadataPerMod3.meta.providersPerRou, ...providersPerRou];
          const corsOptions = this.getCorsOptions(injectorPerMod, mergedPerRou);
          const mergedCorsOptions = mergeOptions(corsOptions);
          providersPerRou.unshift({ token: CorsOptions, useValue: mergedCorsOptions });
          if (singletonPerScope == 'module') {
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

  protected getPathWtihOptions(groupStage1Meta: ExtensionStage1Meta<MetadataPerMod3>[]) {
    const sPathWithOptions = new Set<string>();

    groupStage1Meta.forEach((stage1Meta) => {
      const metadataPerMod3 = stage1Meta.payload;
      metadataPerMod3.aControllerMetadata
        .filter(({ httpMethod }) => httpMethod == 'OPTIONS')
        .forEach(({ path }) => sPathWithOptions.add(path));
    });

    return sPathWithOptions;
  }

  protected getRoutesWithOptions(
    groupStage1Meta: ExtensionStage1Meta<MetadataPerMod3>[],
    aControllerMetadata: ControllerMetadata[],
  ) {
    const sPathWithOptions = this.getPathWtihOptions(groupStage1Meta);
    const newArrControllersMetadata2: ControllerMetadata[] = []; // Routes with OPTIONS methods

    aControllerMetadata.forEach(({ httpMethod, path }) => {
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

      const controllerMetadata: ControllerMetadata = {
        httpMethod: 'OPTIONS',
        path,
        providersPerRou: [
          { token: ALLOW_METHODS, useValue: httpMethods },
          { token: RouteMeta, useValue: routeMeta },
        ],
        providersPerReq: [],
        routeMeta,
        singletonPerScope: 'module',
        guards: [],
      };

      newArrControllersMetadata2.push(controllerMetadata);
    });

    return newArrControllersMetadata2;
  }
}
