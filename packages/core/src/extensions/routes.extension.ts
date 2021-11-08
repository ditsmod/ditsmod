import { Inject, Injectable, ReflectiveInjector } from '@ts-stack/di';

import { APP_METADATA_MAP } from '../constans';
import { ControllerMetadata } from '../decorators/controller';
import { RootMetadata } from '../models/root-metadata';
import { MetadataPerMod } from '../types/metadata-per-mod';
import { AppMetadataMap, GuardItem, NormalizedGuard, Extension } from '../types/mix';
import { RawRouteMeta, RouteMeta } from '../types/route-data';
import { isController, isRoute } from '../utils/type-guards';

@Injectable()
export class RoutesExtension implements Extension<RawRouteMeta[]> {
  protected rawRoutesMeta: RawRouteMeta[] = [];

  constructor(
    protected injectorPerApp: ReflectiveInjector,
    protected rootMetadata: RootMetadata,
    @Inject(APP_METADATA_MAP) protected appMetadataMap: AppMetadataMap
  ) {}

  async init() {
    if (this.rawRoutesMeta.length) {
      return this.rawRoutesMeta;
    }

    const { prefixPerApp } = this.rootMetadata;

    this.appMetadataMap.forEach((metadataPerMod) => {
      const { prefixPerMod, moduleMetadata } = metadataPerMod;
      const rawRoutesMeta = this.getRawRoutesMeta(moduleMetadata.name, prefixPerApp, prefixPerMod, metadataPerMod);
      this.rawRoutesMeta.push(...rawRoutesMeta);
    });

    return this.rawRoutesMeta;
  }

  protected getRawRoutesMeta(
    moduleName: string,
    prefixPerApp: string,
    prefixPerMod: string,
    metadataPerMod: MetadataPerMod
  ) {
    const { controllersMetadata, guardsPerMod, moduleMetadata } = metadataPerMod;

    const providersPerMod = moduleMetadata.providersPerMod.slice();

    const rawRoutesMeta: RawRouteMeta[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          if (!isRoute(decoratorMetadata.value)) {
            continue;
          }
          const providersPerRou = moduleMetadata.providersPerRou.slice();
          const providersPerReq = moduleMetadata.providersPerReq.slice();
          const siblingsPerMod = new Map(metadataPerMod.siblingsPerMod);
          const siblingsPerRou = new Map(metadataPerMod.siblingsPerRou);
          const siblingsPerReq = new Map(metadataPerMod.siblingsPerReq);
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
          rawRoutesMeta.push({
            moduleName,
            httpMethod,
            path,
            providersPerMod,
            providersPerRou,
            providersPerReq,
            siblingsPerMod,
            siblingsPerRou,
            siblingsPerReq,
          });
        }
      }
    }

    return rawRoutesMeta;
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
