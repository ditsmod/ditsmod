import {
  injectable,
  Injector,
  Extension,
  ExtensionManager,
  HttpStatus,
  HttpMethod,
  Provider,
  AppExtensionGroupMeta,
  inject,
  PROVIDERS_PER_APP,
} from '@ditsmod/core';
import { CorsOptions, mergeOptions } from '@ts-stack/cors';
import {
  RequestContext,
  ControllerMeta,
  HTTP_INTERCEPTORS,
  RouteExtensionMeta,
  RouteMeta,
  RestRouteExtension,
} from '@ditsmod/rest';

import { CorsInterceptor } from './cors.interceptor.js';
import { ALLOW_METHODS } from './constans.js';

@injectable()
export class CorsExtension implements Extension<void | false> {
  private registeredPathForOptions = new Map<string, HttpMethod[]>();

  constructor(
    @inject(PROVIDERS_PER_APP) protected providersPerApp: Provider[],
    private extensionManager: ExtensionManager,
  ) {}

  async stage1() {
    const extensionGroupMeta = await this.extensionManager.stage1(RestRouteExtension, this);
    if (extensionGroupMeta.delay) {
      return false;
    }
    this.prepareDataAndSetInterceptors(extensionGroupMeta.groupDataPerApp);

    return; // Make TypeScript happy
  }

  protected prepareDataAndSetInterceptors(groupDataPerApp: AppExtensionGroupMeta<RouteExtensionMeta>[]) {
    groupDataPerApp.forEach((extensionGroupMetaPerApp) => {
      extensionGroupMetaPerApp.groupData.forEach((routeExtensionMeta) => {
        const { controllersMeta } = routeExtensionMeta;
        const { providersPerMod } = routeExtensionMeta.normalizedModuleMeta;
        const injector = Injector.resolveAndCreate([...this.providersPerApp, ...providersPerMod]);
        const routesWithOptions = this.getRoutesWithOptions(
          providersPerMod,
          extensionGroupMetaPerApp.groupData,
          controllersMeta,
        );
        controllersMeta.push(...routesWithOptions);

        controllersMeta.forEach(({ providersPerReq, providersPerRou, scope }) => {
          const mergedPerRou = [...routeExtensionMeta.meta.providersPerRou, ...providersPerRou];
          const corsOptions = this.getCorsOptions(injector, mergedPerRou);
          const mergedCorsOptions = mergeOptions(corsOptions);
          providersPerRou.unshift({ token: CorsOptions, useValue: mergedCorsOptions });
          if (scope == 'route') {
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
    const corsOptions = injectorPerRou.get(CorsOptions, {}) as CorsOptions;
    const clonedCorsOptions = { ...corsOptions };
    if (!clonedCorsOptions.allowedMethods?.length) {
      clonedCorsOptions.allowedMethods = injectorPerRou.get(ALLOW_METHODS, []) as HttpMethod[];
    }

    return clonedCorsOptions;
  }

  protected getPathWtihOptions(aRouteExtensionMeta: RouteExtensionMeta[]) {
    const sPathWithOptions = new Set<string>();

    aRouteExtensionMeta.forEach((routeExtensionMeta) => {
      routeExtensionMeta.controllersMeta
        .filter(({ httpMethods }) => httpMethods.includes('OPTIONS'))
        .forEach(({ fullPath }) => sPathWithOptions.add(fullPath));
    });

    return sPathWithOptions;
  }

  protected getRoutesWithOptions(
    providersPerMod: Provider[],
    aRouteExtensionMeta: RouteExtensionMeta[],
    controllersMeta: ControllerMeta[],
  ) {
    const sPathWithOptions = this.getPathWtihOptions(aRouteExtensionMeta);
    const newArrControllersMeta2: ControllerMeta[] = []; // Routes with OPTIONS methods

    controllersMeta.forEach(({ httpMethods, fullPath }) => {
      httpMethods.forEach((method) => {
        // Search routes with non-OPTIONS methods, and makes new routes with OPTIONS methods
        if (sPathWithOptions.has(fullPath)) {
          return;
        }
        const methodName = Symbol(fullPath);
        const allowHttpMethods = this.registeredPathForOptions.get(fullPath) || [];
        if (allowHttpMethods.length) {
          allowHttpMethods.push(method);
          return;
        }
        allowHttpMethods.push('OPTIONS', method);
        this.registeredPathForOptions.set(fullPath, allowHttpMethods);

        class DynamicController {
          [methodName](ctx: RequestContext) {
            ctx.rawRes.statusCode = HttpStatus.NO_CONTENT;
            ctx.rawRes.setHeader('Allow', allowHttpMethods.join());
            ctx.rawRes.end();
          }
        }

        providersPerMod.unshift(DynamicController);

        const routeMeta: RouteMeta = {
          resolvedGuards: [],
          Controller: DynamicController,
          methodName,
        };

        const controllerMeta: ControllerMeta = {
          httpMethods: ['OPTIONS'],
          fullPath,
          providersPerRou: [
            { token: ALLOW_METHODS, useValue: allowHttpMethods },
            { token: RouteMeta, useValue: routeMeta },
          ],
          providersPerReq: [],
          routeMeta,
          scope: 'route',
          interceptors: [],
          guards: [],
        };

        newArrControllersMeta2.push(controllerMeta);
      });
    });

    return newArrControllersMeta2;
  }
}
