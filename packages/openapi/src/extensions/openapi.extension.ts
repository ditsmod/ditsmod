import { Injectable, Inject, ReflectiveInjector, TypeProvider } from '@ts-stack/di';
import { BodyParserConfig, edk, HttpMethod, RootMetadata, ServiceProvider, GuardItem } from '@ditsmod/core';
import { XPathItemObject } from '@ts-stack/openapi-spec';

import { isOasRoute } from '../utils/type-guards';
import { OasRouteMeta } from '../types/oas-route-meta';
import { OAS_HTTP_METHODS } from '../models/oas-http-methods';

@Injectable()
export class OpenapiExtension implements edk.Extension<edk.RawRouteMeta[]> {
  #rawRoutesMeta: edk.RawRouteMeta[] = [];

  constructor(
    protected injectorPerApp: ReflectiveInjector,
    protected rootMetadata: RootMetadata,
    @Inject(edk.APP_METADATA_MAP) protected appMetadataMap: edk.AppMetadataMap
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
    metadataPerMod: edk.MetadataPerMod
  ) {
    const {
      controllersMetadata,
      guardsPerMod,
      moduleMetadata: { providersPerMod, providersPerReq, name },
    } = metadataPerMod;

    const rawRoutesMeta: edk.RawRouteMeta[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          const oasRoute = decoratorMetadata.value;
          if (!isOasRoute(oasRoute)) {
            continue;
          }
          const httpMethods = this.getHttpMethods(oasRoute.pathItem);

          httpMethods.forEach((httpMethod) => {
            const ctrlDecorValue = ctrlDecorValues.find(edk.isController);
            const guards = [...guardsPerMod, ...this.normalizeGuards(oasRoute.guards)];
            const allProvidersPerReq = this.addProvidersPerReq(
              name,
              controller,
              ctrlDecorValue,
              methodName,
              guards,
              providersPerReq.slice()
            );
            const { path } = oasRoute;
            const parseBody = this.needBodyParse(providersPerMod, allProvidersPerReq, httpMethod);
            const routeMeta: OasRouteMeta = {
              httpMethod,
              path,
              pathItem: oasRoute.pathItem,
              decoratorMetadata,
              controller,
              methodName,
              parseBody,
              guards,
            };
            const providersPerRoute: ServiceProvider[] = [{ provide: edk.RouteMeta, useValue: routeMeta }];

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
          });
        }
      }
    }

    return rawRoutesMeta;
  }

  protected getHttpMethods(pathItem: XPathItemObject) {
    const httpMethods: HttpMethod[] = this.injectorPerApp.get(OAS_HTTP_METHODS);
    return Object.keys(pathItem)
      .map((k) => k.toUpperCase() as HttpMethod)
      .filter((httpMethod) => httpMethods.includes(httpMethod));
  }

  protected normalizeGuards(guards: GuardItem[]) {
    return guards.map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as edk.NormalizedGuard;
      } else {
        return { guard: item } as edk.NormalizedGuard;
      }
    });
  }

  protected addProvidersPerReq(
    moduleName: string,
    Ctrl: TypeProvider,
    controllerMetadata: edk.ControllerMetadata,
    methodName: string,
    normalizedGuards: edk.NormalizedGuard[],
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
