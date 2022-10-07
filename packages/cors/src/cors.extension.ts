import { Injectable, Injector, ReflectiveInjector } from '@ts-stack/di';
import {
  Extension,
  ExtensionsManager,
  HTTP_INTERCEPTORS,
  RouteMeta,
  ROUTES_EXTENSIONS,
  PerAppService,
  ControllersMetadata2,
  Status,
  HttpMethod,
  MetadataPerMod2,
  ServiceProvider,
  Res,
  injectorKey,
} from '@ditsmod/core';
import { CorsOptions, mergeOptions } from '@ts-stack/cors';

import { CorsInterceptor } from './cors.interceptor';
import { ALLOW_METHODS } from './constans';

@Injectable()
export class CorsExtension implements Extension<void | false> {
  private inited: boolean;
  private registeredPathForOptions = new Map<string, HttpMethod[]>();

  constructor(protected perAppService: PerAppService, private extensionsManager: ExtensionsManager) {}

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

  protected prepareDataAndSetInterceptors(aMetadataPerMod2: MetadataPerMod2[], injectorPerApp: ReflectiveInjector) {
    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
      const routesWithOptions = this.getRoutesWithOptions(aMetadataPerMod2, aControllersMetadata2);
      aControllersMetadata2.push(...routesWithOptions);

      aControllersMetadata2.forEach(({ providersPerReq, providersPerRou }) => {
        const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
        const corsOptions = this.getCorsOptions(injectorPerMod, mergedPerRou);
        const mergedCorsOptions = mergeOptions(corsOptions);
        providersPerRou.unshift({ provide: CorsOptions, useValue: mergedCorsOptions });
        providersPerReq.push({ provide: HTTP_INTERCEPTORS, useClass: CorsInterceptor, multi: true });
      });
    });
  }

  protected getCorsOptions(injectorPerMod: ReflectiveInjector, mergedPerRou: ServiceProvider[]) {
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
    const corsOptions = injectorPerRou.get(CorsOptions, {}) as CorsOptions;
    const clonedCorsOptions = { ...corsOptions };
    if (!clonedCorsOptions.allowedMethods?.length) {
      clonedCorsOptions.allowedMethods = injectorPerRou.get(ALLOW_METHODS, []) as HttpMethod[];
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

  protected getRoutesWithOptions(aMetadataPerMod2: MetadataPerMod2[], aControllersMetadata2: ControllersMetadata2[]) {
    const sPathWithOptions = this.getPathWtihOptions(aMetadataPerMod2);
    const newArrControllersMetadata2: ControllersMetadata2[] = []; // Routes with OPTIONS methods

    aControllersMetadata2.forEach(({ httpMethod, path }) => {
      // Search routes with non-OPTIONS methods, and makes new routes with OPTIONS methods
      if (sPathWithOptions.has(path)) {
        return;
      }
      const methodName = Symbol.for(path);
      const httpMethods = this.registeredPathForOptions.get(path) || [];
      if (httpMethods.length) {
        httpMethods.push(httpMethod);
        return;
      }
      httpMethods.push('OPTIONS', httpMethod);
      this.registeredPathForOptions.set(path, httpMethods);

      class DynamicController {
        [methodName]() {
          const inj = (this as any)[injectorKey] as Injector;
          const res = inj.get(Res) as Res;
          res.nodeRes.setHeader('Allow', httpMethods.join());
          res.send(undefined, Status.NO_CONTENT);
        }
      }

      const newRouteMeta: RouteMeta = {
        decoratorMetadata: {} as any,
        controller: DynamicController,
        guards: [],
        methodName: methodName,
      };

      const controllersMetadata2: ControllersMetadata2 = {
        httpMethod: 'OPTIONS',
        path,
        providersPerRou: [
          { provide: ALLOW_METHODS, useValue: httpMethods },
          { provide: RouteMeta, useValue: newRouteMeta },
        ],
        providersPerReq: [DynamicController],
      };

      newArrControllersMetadata2.push(controllersMetadata2);
    });

    return newArrControllersMetadata2;
  }
}
