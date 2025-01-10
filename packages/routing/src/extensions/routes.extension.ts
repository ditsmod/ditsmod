import { inspect } from 'node:util';
import {
  injectable,
  Extension,
  Provider,
  isCtrlDecor,
  AppOptions,
  ControllerRawMetadata1,
  reflector,
  Class,
  MetadataPerMod2,
  HttpMethod,
} from '@ditsmod/core';

import { MetadataPerMod3 } from '../types.js';
import { isRoute } from '../type.guards.js';
import { RouteMetadata } from '../decorators/route.js';
import { ControllerMetadata } from '../controller-metadata.js';
import { RouteMeta } from '../route-data.js';
import { GuardItem, GuardPerMod1 } from '#mod/interceptors/guard.js';

@injectable()
export class RoutesExtension implements Extension<MetadataPerMod3> {
  protected metadataPerMod3: MetadataPerMod3;

  constructor(
    protected appOptions: AppOptions,
    protected metadataPerMod2: MetadataPerMod2,
  ) {}

  async stage1() {
    const { path: prefixPerApp } = this.appOptions;
    this.metadataPerMod3 = new MetadataPerMod3();
    this.metadataPerMod3.meta = this.metadataPerMod2.meta;
    this.metadataPerMod3.aControllerMetadata = this.getControllersMetadata(prefixPerApp, this.metadataPerMod2);
    // this.metadataPerMod3.guardsPerMod1 = this.metadataPerMod2.guardsPerMod1;
    this.metadataPerMod3.guardsPerMod1 = [];

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
            const { path: controllerPath, httpMethod, interceptors } = route;
            const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');
            const fullPath = this.getPath(prefix, controllerPath);
            const guards = this.normalizeGuards(httpMethod, fullPath, route.guards).slice();
            providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
            providersPerReq.push(...((ctrlDecorator?.value as ControllerRawMetadata1).providersPerReq || []));

            const routeMeta: RouteMeta = {
              Controller,
              methodName,
            };
            providersPerRou.push({ token: RouteMeta, useValue: routeMeta });
            aControllerMetadata.push({
              httpMethods: Array.isArray(httpMethod) ? httpMethod : [httpMethod],
              fullPath,
              providersPerRou,
              providersPerReq,
              routeMeta,
              scope,
              guards,
              interceptors,
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

  protected normalizeGuards(httpMethod: HttpMethod | HttpMethod[], path: string, guards?: GuardItem[]) {
    return (guards || []).map((item) => {
      if (Array.isArray(item)) {
        this.checkGuardsPerMod(httpMethod, path, item[0]);
        return { guard: item[0], params: item.slice(1) } as GuardPerMod1;
      } else {
        this.checkGuardsPerMod(httpMethod, path, item);
        return { guard: item } as GuardPerMod1;
      }
    });
  }

  protected checkGuardsPerMod(httpMethod: HttpMethod | HttpMethod[], path: string, Guard: Class) {
    const type = typeof Guard?.prototype.canActivate;
    if (type != 'function') {
      const methods = Array.isArray(httpMethod) ? httpMethod.join(', ') : httpMethod;
      const whatIsThis = inspect(Guard, false, 3);
      throw new TypeError(
        `Validation of route "${methods} ${path}" failed: Guard.prototype.canActivate must be a function, got: ${type} (in ${whatIsThis})`,
      );
    }
  }
}
