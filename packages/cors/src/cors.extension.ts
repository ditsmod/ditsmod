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
import { CorsOptions } from '@ts-stack/cors';
import { Optional } from '@ts-stack/di';

import { initCors } from './init-cors';
import { CorsInterceptor } from './cors.interceptor';
import { MergedCorsOptions } from './merged-cors-options';

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
    const allPathWithOptions = new Set<string>();

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      metadataPerMod2.aControllersMetadata2
        .filter(({ httpMethod }) => httpMethod == 'OPTIONS')
        .forEach(({ path }) => allPathWithOptions.add(path));
    });

    aMetadataPerMod2.forEach((metadataPerMod2) => {
      const { aControllersMetadata2, providersPerMod } = metadataPerMod2;
      const injectorPerApp = this.perAppService.injector;
      const injectorPerMod = injectorPerApp.resolveAndCreateChild(providersPerMod);
      const newArrControllersMetadata2: ControllersMetadata2[] = [];

      aControllersMetadata2.forEach(({ providersPerReq, providersPerRou, httpMethod, path }) => {
        if (!allPathWithOptions.has(path)) {
          const controllersMetadata2 = this.getControllersMetadata2(
            path,
            httpMethod,
            metadataPerMod2,
            providersPerRou,
            injectorPerMod
          );
          if (controllersMetadata2) {
            newArrControllersMetadata2.push(controllersMetadata2);
          }
        }

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

      aControllersMetadata2.push(...newArrControllersMetadata2);
    });

    this.inited = true;
    return; // Make TypeScript happy
  }

  protected getControllersMetadata2(
    path: string,
    httpMethod: HttpMethod,
    metadataPerMod2: MetadataPerMod2,
    providersPerRou: ServiceProvider[],
    injectorPerMod: ReflectiveInjector
  ) {
    if (httpMethod == 'OPTIONS') {
      return;
    }
    const mergedPerRou = [...metadataPerMod2.providersPerRou, ...providersPerRou];
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(mergedPerRou);
    const routeMeta = injectorPerRou.get(RouteMeta) as RouteMeta;
    const newRouteMeta = { ...routeMeta };
    newRouteMeta.httpMethod = 'OPTIONS';
    const methodName = Symbol.for(path);
    const httpMethods = this.registeredPathForOptions.get(path) || [];
    if (httpMethods.length) {
      httpMethods.push(httpMethod);
      return;
    }
    httpMethods.push('OPTIONS', httpMethod);
    this.registeredPathForOptions.set(path, httpMethods);
    // prettier-ignore
    class DynamicController extends (newRouteMeta.controller) {
      [methodName]() {
        const inj = (this as any)[injectorKey] as Injector;
        const res = inj.get(Res) as Res;
        res.nodeRes.setHeader('Allow', httpMethods.join());
        res.send(undefined, Status.NO_CONTENT);
      }
    }
    newRouteMeta.controller = DynamicController;
    newRouteMeta.methodName = methodName;
    const controllersMetadata2: ControllersMetadata2 = {
      httpMethod: 'OPTIONS',
      path,
      providersPerRou: [{ provide: RouteMeta, useValue: newRouteMeta }],
      providersPerReq: [DynamicController],
    };
    return controllersMetadata2;
  }
}
