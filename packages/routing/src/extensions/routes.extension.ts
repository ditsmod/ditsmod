import {
  injectable,
  Extension,
  GuardItem,
  Provider,
  isCtrlDecor,
  AppOptions,
  ControllerRawMetadata1,
  GuardPerMod1,
  reflector,
  Class,
  MetadataPerMod2,
} from '@ditsmod/core';

import { MetadataPerMod3 } from '../types.js';
import { isRoute } from '../type.guards.js';
import { RouteMetadata } from '../decorators/route.js';
import { ControllerMetadata } from '../controller-metadata.js';
import { RouteMeta } from '../route-data.js';

@injectable()
export class RoutesExtension implements Extension<MetadataPerMod3> {
  protected metadataPerMod3: MetadataPerMod3;

  constructor(
    protected appOptions: AppOptions,
    protected metadataPerMod2: MetadataPerMod2,
  ) {}

  async stage1() {
    if (this.metadataPerMod3) {
      return this.metadataPerMod3;
    }

    const { path: prefixPerApp } = this.appOptions;
    this.metadataPerMod3 = new MetadataPerMod3();
    this.metadataPerMod3.meta = this.metadataPerMod2.meta;
    this.metadataPerMod3.aControllerMetadata = this.getControllersMetadata(prefixPerApp, this.metadataPerMod2);
    this.metadataPerMod3.guardsPerMod1 = this.metadataPerMod2.guardsPerMod1;

    return this.metadataPerMod3;
  }

  protected getControllersMetadata(prefixPerApp: string = '', metadataPerMod2: MetadataPerMod2) {
    const { applyControllers, prefixPerMod, meta } = metadataPerMod2;

    const aControllerMetadata: ControllerMetadata[] = [];
    if (applyControllers)
      for (const Controller of metadataPerMod2.meta.controllers as Class<Record<string | symbol, any>>[]) {
        const classMeta = reflector.getMetadata(Controller)!;
        for (const methodName of classMeta) {
          for (const decoratorAndValue of classMeta[methodName].decorators) {
            if (!isRoute<RouteMetadata>(decoratorAndValue)) {
              continue;
            }
            const providersPerRou: Provider[] = [];
            const providersPerReq: Provider[] = [];
            const route = decoratorAndValue.value;
            const ctrlDecorator = classMeta.constructor.decorators.find(isCtrlDecor);
            const scope = ctrlDecorator?.value.scope;
            if (scope == 'ctx') {
              meta.providersPerMod.unshift(Controller);
            }
            const guards = this.normalizeGuards(route.guards).slice();
            providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
            providersPerReq.push(...((ctrlDecorator?.value as ControllerRawMetadata1).providersPerReq || []));
            const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');
            const { path: controllerPath, httpMethod } = route;
            const path = this.getPath(prefix, controllerPath);

            const routeMeta: RouteMeta = {
              decoratorAndValue,
              Controller,
              methodName,
            };
            providersPerRou.push({ token: RouteMeta, useValue: routeMeta });
            aControllerMetadata.push({
              httpMethod,
              path,
              providersPerRou,
              providersPerReq,
              routeMeta,
              scope,
              guards,
            });
          }
        }
      }

    return aControllerMetadata;
  }

  /**
   * Compiles the path for the controller given the prefix.
   *
   * - If prefix `/api/posts/:postId` and route path `:postId`, this method returns path `/api/posts/:postId`.
   * - If prefix `/api/posts` and route path `:postId`, this method returns `/api/posts/:postId`
   */
  protected getPath(prefix?: string, path?: string) {
    const prefixLastPart = prefix?.split('/').at(-1);
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
        return { guard: item[0], params: item.slice(1) } as GuardPerMod1;
      } else {
        return { guard: item } as GuardPerMod1;
      }
    });
  }
}
