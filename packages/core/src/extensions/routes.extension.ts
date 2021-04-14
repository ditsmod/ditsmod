import { Inject, Injectable, ReflectiveInjector, TypeProvider } from '@ts-stack/di';

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
    protected injectorPerApp: ReflectiveInjector,
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
          const route = decoratorMetadata.value;
          const ctrlDecorator = ctrlDecorValues.find(isController);
          const guards = [...guardsPerMod, ...this.normalizeGuards(route.guards)];
          const allProvidersPerReq = this.addProvidersPerReq(
            moduleName,
            controller,
            ctrlDecorator.providersPerReq,
            methodName,
            guards,
            providersPerReq
          );
          const parseBody = this.needBodyParse(providersPerMod, providersPerRou, allProvidersPerReq, route.httpMethod);
          const routeMeta: RouteMeta = {
            httpMethod: route.httpMethod,
            path: route.path,
            decoratorMetadata,
            controller,
            methodName,
            parseBody,
            guards,
          };

          providersPerRou.push({ provide: RouteMeta, useValue: routeMeta }, ...(ctrlDecorator.providersPerRou || []));

          const { path, httpMethod } = route;

          rawRoutesMeta.push({
            moduleName,
            providersPerMod,
            providersPerRou,
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
    providersPerReq: ServiceProvider[],
    methodName: string,
    normalizedGuards: NormalizedGuard[],
    allProvidersPerReq: ServiceProvider[]
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

    const providersOfController = providersPerReq || [];
    allProvidersPerReq.unshift(Ctrl, ...guards, ...providersOfController);

    return allProvidersPerReq;
  }

  /**
   * Need or not to parse body of HTTP request.
   */
  protected needBodyParse(
    providersPerMod: ServiceProvider[],
    providersPerRou: ServiceProvider[],
    providersPerReq: ServiceProvider[],
    httpMethod: HttpMethod
  ) {
    const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);
    const injectorPerRou = injectorPerMod.resolveAndCreateChild(providersPerRou);
    const injectorPerReq = injectorPerRou.resolveAndCreateChild(providersPerReq);
    const bodyParserConfig = injectorPerReq.get(BodyParserConfig) as BodyParserConfig;
    return bodyParserConfig.acceptMethods.includes(httpMethod);
  }
}
