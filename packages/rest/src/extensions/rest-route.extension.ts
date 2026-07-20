import { inspect } from 'node:util';
import { injectable, Extension, Provider, Reflector, Class, HttpMethod, ResolvedModuleMeta } from '@ditsmod/core';

import { RouteExtensionMeta } from '#types/types.js';
import { isControllerDecorator, isRoute } from '#types/type.guards.js';
import { RouteMetadata } from '#decorators/route.js';
import { ControllerMeta } from '#types/controller-metadata.js';
import { RouteMeta } from '#types/route-data.js';
import { GuardItem, ModuleScopedGuard } from '#interceptors/guard.js';
import { RequestScopedControllerOptions } from '#types/controller.js';
import { AppOptions } from '#types/app-options.js';
import { initRest } from '#decorators/rest-init-hooks-and-metadata.js';
import { RestResolvedModuleMeta } from '#init/types.js';
import { FailedValidationOfRoute } from '#errors';

@injectable()
export class RestRouteExtension implements Extension<RouteExtensionMeta> {
  protected routeExtensionMeta: RouteExtensionMeta;

  constructor(
    protected appOptions: AppOptions,
    protected resolvedModuleMeta: ResolvedModuleMeta<RestResolvedModuleMeta>,
  ) {}

  async stage1() {
    const restResolvedModuleMeta = this.resolvedModuleMeta.deepImportedModules.get(initRest)!;
    this.routeExtensionMeta = new RouteExtensionMeta();
    this.routeExtensionMeta.meta = restResolvedModuleMeta.meta;
    const { path: prefixPerApp } = this.appOptions;
    this.routeExtensionMeta.prefixPerMod = restResolvedModuleMeta.prefixPerMod;
    this.routeExtensionMeta.normalizedModuleMeta = this.resolvedModuleMeta.normalizedModuleMeta;
    this.routeExtensionMeta.aControllerMeta = this.getControllersMetadata(prefixPerApp, restResolvedModuleMeta);
    this.routeExtensionMeta.guards1 = restResolvedModuleMeta.guards1;
    // this.routeExtensionMeta.guards1 = [];

    return this.routeExtensionMeta;
  }

  protected getControllersMetadata(prefixPerApp: string = '', restResolvedModuleMeta: RestResolvedModuleMeta) {
    const { normalizedModuleMeta, prefixPerMod, applyControllers } = restResolvedModuleMeta;

    const aControllerMeta: ControllerMeta[] = [];
    if (applyControllers)
      for (const Controller of restResolvedModuleMeta.meta.controllers) {
        const classMeta = Reflector.collectMeta(Controller)!;
        for (const methodName of classMeta) {
          for (const decoratorMeta of classMeta[methodName].decorators) {
            if (!isRoute<RouteMetadata>(decoratorMeta)) {
              continue;
            }
            const providersPerRou: Provider[] = [];
            const providersPerReq: Provider[] = [];
            const route = decoratorMeta.value;
            const ctrlDecorator = classMeta.constructor.decorators.find(isControllerDecorator);
            const scope = ctrlDecorator?.value.scope;
            if (scope == 'route' && !normalizedModuleMeta.providersPerMod.includes(Controller)) {
              normalizedModuleMeta.providersPerMod.unshift(Controller);
            }
            const { path: controllerPath, httpMethod, interceptors } = route;
            const prefix = [prefixPerApp, prefixPerMod].filter((s) => s).join('/');
            const fullPath = this.getPath(prefix, controllerPath);
            const guards = this.normalizeGuards(httpMethod, fullPath, route.guards).slice();
            providersPerRou.push(...(ctrlDecorator?.value.providersPerRou || []));
            providersPerReq.push(...((ctrlDecorator?.value as RequestScopedControllerOptions).providersPerReq || []));

            const routeMeta: RouteMeta = {
              Controller,
              methodName,
            };
            providersPerRou.push({ token: RouteMeta, useValue: routeMeta });
            aControllerMeta.push({
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

    return aControllerMeta;
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
        return { guard: item[0], params: item.slice(1) } as ModuleScopedGuard;
      } else {
        this.checkGuardsPerMod(httpMethod, path, item);
        return { guard: item } as ModuleScopedGuard;
      }
    });
  }

  protected checkGuardsPerMod(httpMethod: HttpMethod | HttpMethod[], path: string, Guard: Class) {
    const type = typeof Guard?.prototype.canActivate;
    if (type != 'function') {
      const methods = Array.isArray(httpMethod) ? httpMethod.join(', ') : httpMethod;
      const whatIsThis = inspect(Guard, false, 3);
      throw new FailedValidationOfRoute(methods, path, type, whatIsThis);
    }
  }
}
