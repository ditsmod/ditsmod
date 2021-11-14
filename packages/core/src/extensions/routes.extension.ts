import { Inject, Injectable, ReflectiveInjector } from '@ts-stack/di';

import { APP_METADATA_MAP } from '../constans';
import { ControllerMetadata } from '../decorators/controller';
import { RootMetadata } from '../models/root-metadata';
import { MetadataPerMod } from '../types/metadata-per-mod';
import { AppMetadataMap, GuardItem, NormalizedGuard, Extension, ServiceProvider } from '../types/mix';
import { RawRouteMeta, RouteMetaPerMod, RouteMeta } from '../types/route-data';
import { isController, isRoute } from '../utils/type-guards';

@Injectable()
export class RoutesExtension implements Extension<RouteMetaPerMod[]> {
  protected routesMetaPerMod: RouteMetaPerMod[] = [];

  constructor(
    protected injectorPerApp: ReflectiveInjector,
    protected rootMetadata: RootMetadata,
    @Inject(APP_METADATA_MAP) protected appMetadataMap: AppMetadataMap
  ) {}

  async init() {
    if (this.routesMetaPerMod.length) {
      return this.routesMetaPerMod;
    }

    const { prefixPerApp } = this.rootMetadata;

    this.appMetadataMap.forEach((metadataPerMod) => {
      const routeMetaPerMod = new RouteMetaPerMod();
      const { moduleMetadata } = metadataPerMod;
      routeMetaPerMod.module = moduleMetadata.module;
      routeMetaPerMod.moduleName = moduleMetadata.name;
      routeMetaPerMod.providersPerMod = moduleMetadata.providersPerMod.slice();
      routeMetaPerMod.providersPerRou = moduleMetadata.providersPerRou.slice();
      routeMetaPerMod.providersPerReq = moduleMetadata.providersPerReq.slice();
      routeMetaPerMod.siblingsTokens = metadataPerMod.siblingsTokens;
      routeMetaPerMod.rawRoutesMeta = this.getMetaPerRou(prefixPerApp, metadataPerMod);
      this.routesMetaPerMod.push(routeMetaPerMod);
    });

    return this.routesMetaPerMod;
  }

  protected getMetaPerRou(prefixPerApp: string, metadataPerMod: MetadataPerMod) {
    const { controllersMetadata, prefixPerMod, guardsPerMod } = metadataPerMod;

    const rawRouteMeta: RawRouteMeta[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          if (!isRoute(decoratorMetadata.value)) {
            continue;
          }
          const providersPerRou: ServiceProvider[] = [];
          const providersPerReq: ServiceProvider[] = [];
          const route = decoratorMetadata.value;
          const ctrlDecorator = ctrlDecorValues.find(isController) as ControllerMetadata;
          const guards = [...guardsPerMod, ...this.normalizeGuards(route.guards)];
          providersPerRou.push(...(ctrlDecorator.providersPerRou || []));
          providersPerReq.push(...(ctrlDecorator.providersPerReq || []), controller);
          const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');
          const { path: controllerPath, httpMethod } = route;
          const path = this.getPath(prefix, controllerPath);
          const routeMeta: RouteMeta = {
            httpMethod: route.httpMethod,
            path,
            decoratorMetadata,
            controller,
            methodName,
            guards,
          };
          providersPerRou.push({ provide: RouteMeta, useValue: routeMeta });
          rawRouteMeta.push({
            httpMethod,
            path,
            providersPerRou,
            providersPerReq,
          });
        }
      }
    }

    return rawRouteMeta;
  }

  /**
   * Compiles the path for the controller given the prefix.
   *
   * - If prefix `/api/posts/:postId` and route path `:postId`, this method returns path `/api/posts/:postId`.
   * - If prefix `/api/posts` and route path `:postId`, this method returns `/api/posts/:postId`
   */
  protected getPath(prefix?: string, path?: string) {
    const prefixLastPart = prefix?.split('/').slice(-1)[0];
    if (prefixLastPart?.charAt(0) == ':') {
      const reducedPrefix = prefix?.split('/').slice(0, -1).join('/');
      return [reducedPrefix, path].filter((s) => s).join('/');
    } else {
      return [prefix, path].filter((s) => s).join('/');
    }
  }

  protected normalizeGuards(guards?: GuardItem[]) {
    return (guards || []).map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
      } else {
        return { guard: item } as NormalizedGuard;
      }
    });
  }
}
