import { Inject, Injectable, ReflectiveInjector, TypeProvider } from '@ts-stack/di';

import { ControllerMetadata } from '../decorators/controller';
import { BodyParserConfig } from '../models/body-parser-config';
import { RootMetadata } from '../models/root-metadata';
import { Extension } from '../types/extension';
import { ExtensionMetadata } from '../types/extension-metadata';
import { ExtensionsMap, EXTENSIONS_MAP } from '../types/extensions-map';
import { GuardItem } from '../types/mix';
import { HttpMethod } from '../types/http-method';
import { NormalizedGuard } from '../types/normalized-guard';
import { PreRouteMeta, RouteData } from '../types/route-data';
import { ServiceProvider } from '../types/service-provider';
import { isController, isRoute } from '../utils/type-guards';

@Injectable()
export class PreRoutes implements Extension<PreRouteMeta[]> {
  #preRoutesMeta: PreRouteMeta[] = [];

  constructor(
    protected injectorPerApp: ReflectiveInjector,
    protected rootMetadata: RootMetadata,
    @Inject(EXTENSIONS_MAP) protected extensionsMap: ExtensionsMap
  ) {}

  async init() {
    if (this.#preRoutesMeta.length) {
      return this.#preRoutesMeta;
    }

    const { prefixPerApp } = this.rootMetadata;

    this.extensionsMap.forEach((extensionsMetadata) => {
      const { prefixPerMod, moduleMetadata } = extensionsMetadata;
      const preRoutesMeta = this.getRoutesData(moduleMetadata.name, prefixPerApp, prefixPerMod, extensionsMetadata);
      this.#preRoutesMeta.push(...preRoutesMeta);
    });

    return this.#preRoutesMeta;
  }

  protected getRoutesData(
    moduleName: string,
    prefixPerApp: string,
    prefixPerMod: string,
    extensionMetadata: ExtensionMetadata
  ) {
    const {
      controllersMetadata,
      guardsPerMod,
      moduleMetadata: { providersPerMod, providersPerReq, name },
    } = extensionMetadata;

    const preRoutesMeta: PreRouteMeta[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          if (!isRoute(decoratorMetadata.value)) {
            continue;
          }
          const route = decoratorMetadata.value;
          const ctrlDecorValue = ctrlDecorValues.find(isController);
          const guards = [...guardsPerMod, ...this.normalizeGuards(route.guards)];
          const allProvidersPerReq = this.addProvidersPerReq(
            name,
            controller,
            ctrlDecorValue,
            methodName,
            guards,
            providersPerReq.slice()
          );
          const parseBody = this.needBodyParse(providersPerMod, allProvidersPerReq, route.httpMethod);
          const routeData: RouteData = {
            decoratorMetadata,
            controller,
            methodName,
            route,
            providersPerMod,
            providersPerReq: allProvidersPerReq,
            parseBody,
            guards,
          };
          const providersPerRoute: ServiceProvider[] = [{ provide: RouteData, useValue: routeData }];
          const { path, httpMethod } = route;

          preRoutesMeta.push({
            moduleName,
            providersPerMod,
            providersPerRoute,
            providersPerReq: allProvidersPerReq,
            prefixPerApp,
            prefixPerMod,
            path,
            httpMethod,
          });
        }
      }
    }

    return preRoutesMeta;
  }

  protected normalizeGuards(guards: GuardItem[]) {
    return guards.map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
      } else {
        return { guard: item } as NormalizedGuard;
      }
    });
  }

  protected addProvidersPerReq(
    moduleName: string,
    Ctrl: TypeProvider,
    controllerMetadata: ControllerMetadata,
    methodName: string,
    normalizedGuards: NormalizedGuard[],
    providersPerReq: ServiceProvider[]
  ) {
    const guards = normalizedGuards.map((item) => item.guard);

    for (const Guard of guards) {
      const type = typeof Guard?.prototype.canActivate;
      if (type != 'function') {
        const guardName = Guard.name || 'Guard';
        throw new TypeError(
          `${moduleName} --> ${Ctrl.name} --> ${methodName}(): ${guardName} must have canActivate method, got: ${type}`
        );
      }
    }

    const providersOfController = controllerMetadata.providersPerReq || [];
    providersPerReq.unshift(Ctrl, ...guards, ...providersOfController);

    return providersPerReq;
  }

  /**
   * Need or not to parse body of HTTP request.
   */
  protected needBodyParse(
    providersPerMod: ServiceProvider[],
    providersPerReq: ServiceProvider[],
    httpMethod: HttpMethod
  ) {
    const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
    const injectorPerReq = injectorPerMod.resolveAndCreateChild(providersPerReq);
    const bodyParserConfig = injectorPerReq.get(BodyParserConfig) as BodyParserConfig;
    return bodyParserConfig.acceptMethods.includes(httpMethod);
  }
}
