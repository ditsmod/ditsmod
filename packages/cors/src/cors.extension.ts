import {
  inject,
  injectable,
  Injector,
  NodeResponse,
  NODE_RES,
  Res,
  Extension,
  ExtensionsManager,
  HTTP_INTERCEPTORS,
  RouteMeta,
  PerAppService,
  ControllerMetadata2,
  Status,
  HttpMethod,
  MetadataPerMod2,
  ServiceProvider,
  methodFactory,
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

    const aMetadataPerMod2 = await this.extensionsManager.init(ROUTES_EXTENSIONS, true, CorsExtension);
    if (aMetadataPerMod2 === false) {
      return false;
    }
    this.prepareDataAndSetInterceptors(aMetadataPerMod2, this.perAppService.injector);

    this.inited = true;
    return; // Make TypeScript happy
  }

  protected prepareDataAndSetInterceptors(aMetadataPerMod2: MetadataPerMod2[], injectorPerApp: Injector) {
    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
      const routesWithOptions = this.getRoutesWithOptions(aMetadataPerMod2, aControllersMetadata2);
      aControllersMetadata2.push(...routesWithOptions);

      aControllersMetadata2.forEach(({ providersPerReq, providersPerRou }) => {
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const corsOptions = this.getCorsOptions(injectorPerMod, mergedPerRou);
        const mergedCorsOptions = mergeOptions(corsOptions);
        providersPerRou.unshift({ token: CorsOptions, useValue: mergedCorsOptions });
        providersPerReq.push({ token: HTTP_INTERCEPTORS, useClass: CorsInterceptor, multi: true });
      });
    });
  }

  protected getCorsOptions(injectorPerMod: Injector, mergedPerRou: ServiceProvider[]) {
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
    const corsOptions = injectorPerRou.get(CorsOptions, undefined, {}) as CorsOptions;
    const clonedCorsOptions = { ...corsOptions };
    if (!clonedCorsOptions.allowedMethods?.length) {
      clonedCorsOptions.allowedMethods = injectorPerRou.get(ALLOW_METHODS, undefined, []) as HttpMethod[];
    }

    return clonedCorsOptions;
  }

  protected getPathWtihOptions(aMetadataPerMod2: MetadataPerMod2[]) {
    const sPathWithOptions = new Set<string>();

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      metadataPerMod2.aControllersMetadata2
        .filter(({ httpMethod }) => httpMethod == 'OPTIONS')
        .forEach(({ path }) => sPathWithOptions.add(path));
    });

    return sPathWithOptions;
  }

  protected getRoutesWithOptions(aMetadataPerMod2: MetadataPerMod2[], aControllersMetadata2: ControllerMetadata2[]) {
    const sPathWithOptions = this.getPathWtihOptions(aMetadataPerMod2);
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
        @methodFactory()
        [methodName](@inject(NODE_RES) nodeRes: NodeResponse, res: Res) {
          nodeRes.setHeader('Allow', httpMethods.join());
          res.send(undefined, Status.NO_CONTENT);
        }
      }

      const routeMeta: RouteMeta = {
        decoratorMetadata: {} as any,
        resolvedGuards: [],
        resolvedProvider: RouteMeta.getResolvedProvider(DynamicController, methodName),
      };

      const controllersMetadata2: ControllerMetadata2 = {
        httpMethod: 'OPTIONS',
        path,
        providersPerRou: [
          { token: ALLOW_METHODS, useValue: httpMethods },
          { token: RouteMeta, useValue: routeMeta },
        ],
        providersPerReq: [{ useFactory: [DynamicController, DynamicController.prototype[methodName]] }],
        routeMeta,
      };

      newArrControllersMetadata2.push(controllersMetadata2);
    });

    return newArrControllersMetadata2;
  }
}
