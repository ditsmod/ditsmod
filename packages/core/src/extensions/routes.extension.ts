import { Injectable } from '@ts-stack/di';

import { RootMetadata } from '../models/root-metadata';
import { ControllersMetadata2 } from '../types/controller-metadata';
import { MetadataPerMod1, MetadataPerMod2 } from '../types/metadata-per-mod';
import { GuardItem, NormalizedGuard, Extension, ServiceProvider } from '../types/mix';
import { RouteMeta } from '../types/route-data';
import { isController, isRoute } from '../utils/type-guards';

@Injectable()
export class RoutesExtension implements Extension<MetadataPerMod2> {
  protected metadataPerMod2: MetadataPerMod2;

  constructor(protected rootMetadata: RootMetadata, protected metadataPerMod1: MetadataPerMod1) {}

  async init() {
    if (this.metadataPerMod2) {
      return this.metadataPerMod2;
    }

    const { prefixPerApp } = this.rootMetadata;
    const { meta } = this.metadataPerMod1;
    this.metadataPerMod2 = new MetadataPerMod2();
    this.metadataPerMod2.module = meta.module;
    this.metadataPerMod2.moduleName = meta.name;
    this.metadataPerMod2.providersPerMod = meta.providersPerMod.slice();
    this.metadataPerMod2.providersPerRou = meta.providersPerRou.slice();
    this.metadataPerMod2.providersPerReq = meta.providersPerReq.slice();
    this.metadataPerMod2.aControllersMetadata2 = this.getControllersMetadata2(prefixPerApp, this.metadataPerMod1);

    return this.metadataPerMod2;
  }

  protected getControllersMetadata2(prefixPerApp: string, metadataPerMod1: MetadataPerMod1) {
    const { aControllersMetadata1, prefixPerMod, guardsPerMod } = metadataPerMod1;

    const controllersMetadata2: ControllersMetadata2[] = [];
    for (const { controller, ctrlDecorValues, methods } of aControllersMetadata1) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          if (!isRoute(decoratorMetadata.value)) {
            continue;
          }
          const providersPerRou: ServiceProvider[] = [];
          const providersPerReq: ServiceProvider[] = [];
          const route = decoratorMetadata.value;
          const ctrlDecorator = ctrlDecorValues.find(isController);
          const guards = [...guardsPerMod, ...this.normalizeGuards(route.guards)];
          providersPerRou.push(...(ctrlDecorator?.providersPerRou || []));
          providersPerReq.push(...(ctrlDecorator?.providersPerReq || []), controller);
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
          controllersMetadata2.push({
            httpMethod,
            path,
            providersPerRou,
            providersPerReq,
          });
        }
      }
    }

    return controllersMetadata2;
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
