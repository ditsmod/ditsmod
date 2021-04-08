import { Inject, Injectable, ReflectiveInjector, TypeProvider } from '@ts-stack/di';

import { ControllerMetadata } from '../decorators/controller';
import { BodyParserConfig } from '../models/body-parser-config';
import { RootMetadata } from '../models/root-metadata';
import { Extension } from '../types/extension';
import { MetadataPerMod } from '../types/metadata-per-mod';
import { AppMetadataMap, APP_METADATA_MAP } from '../types/app-metadata-map';
import { GuardItem, HttpMethod, NormalizedGuard, ServiceProvider } from '../types/mix';
import { RawRouteMeta, RouteMeta } from '../types/route-data';
import { isController, isRoute } from '../utils/type-guards';

@Injectable()
export class RoutesExtension implements Extension<RawRouteMeta[]> {
  #rawRoutesMeta: RawRouteMeta[] = [];

  constructor(
    protected injector: ReflectiveInjector,
    protected rootMetadata: RootMetadata,
    @Inject(APP_METADATA_MAP) protected appMetadataMap: AppMetadataMap
  ) {}

  async init() {
    if (this.#rawRoutesMeta.length) {
      return this.#rawRoutesMeta;
    }

    const { prefixPerApp } = this.rootMetadata;

    this.appMetadataMap.forEach((metadataPerMod) => {
      const { prefixPerMod, moduleMetadata } = metadataPerMod;
      const rawRoutesMeta = this.getRawRoutesMeta(moduleMetadata.name, prefixPerApp, prefixPerMod, metadataPerMod);
      this.#rawRoutesMeta.push(...rawRoutesMeta);
    });

    return this.#rawRoutesMeta;
  }

  protected getRawRoutesMeta(
    moduleName: string,
    prefixPerApp: string,
    prefixPerMod: string,
    metadataPerMod: MetadataPerMod
  ) {
    const {
      controllersMetadata,
      guardsPerMod,
      moduleMetadata: { providersPerMod, providersPerReq, name },
    } = metadataPerMod;

    const rawRoutesMeta: RawRouteMeta[] = [];
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
          const routeMeta: RouteMeta = {
            decoratorMetadata,
            controller,
            methodName,
            route,
            providersPerMod,
            providersPerReq: allProvidersPerReq,
            parseBody,
            guards,
          };
          const providersPerRoute: ServiceProvider[] = [{ provide: RouteMeta, useValue: routeMeta }];
          const { path, httpMethod } = route;

          rawRoutesMeta.push({
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

    return rawRoutesMeta;
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
    const injectorPerMod = this.injector.resolveAndCreateChild(providersPerMod);
    const injectorPerReq = injectorPerMod.resolveAndCreateChild(providersPerReq);
    const bodyParserConfig = injectorPerReq.get(BodyParserConfig) as BodyParserConfig;
    return bodyParserConfig.acceptMethods.includes(httpMethod);
  }
}
