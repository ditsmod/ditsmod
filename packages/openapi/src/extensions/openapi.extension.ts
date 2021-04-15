import { Injectable, Inject, ReflectiveInjector, TypeProvider } from '@ts-stack/di';
import { BodyParserConfig, edk, HttpMethod, RootMetadata, ServiceProvider, GuardItem } from '@ditsmod/core';
import { OperationObject, ParameterObject, ReferenceObject, XPathItemObject } from '@ts-stack/openapi-spec';

import { isOasRoute, isReferenceObject } from '../utils/type-guards';
import { OasRouteMeta } from '../types/oas-route-meta';
import { OAS_HTTP_METHODS } from '../di-tokens';
import { getLastParameterObjects, getLastReferenceObjects } from '../utils/get-last-params';

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
    const { controllersMetadata, guardsPerMod, moduleMetadata } = metadataPerMod;

    const providersPerMod = moduleMetadata.providersPerMod.slice();

    const rawRoutesMeta: edk.RawRouteMeta[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          const oasRoute = decoratorMetadata.value;
          if (!isOasRoute(oasRoute)) {
            continue;
          }

          this.getHttpMethods(oasRoute.pathItem).forEach((httpMethod) => {
            const providersPerRou = moduleMetadata.providersPerRou.slice();
            const providersPerReq = moduleMetadata.providersPerReq.slice();
            const ctrlDecorator = ctrlDecorValues.find(edk.isController);
            const guards = [...guardsPerMod, ...this.normalizeGuards(oasRoute.guards)];
            const allProvidersPerReq = this.addProvidersPerReq(
              moduleName,
              controller,
              ctrlDecorator.providersPerReq,
              methodName,
              guards,
              providersPerReq.slice()
            );
            const { params, paramsRefs } = this.mergeParams(oasRoute.pathItem, httpMethod);
            const path = this.transformPath(oasRoute.path, params);
            providersPerRou.push(...(ctrlDecorator.providersPerRou || []));
            const parseBody = this.needBodyParse(providersPerMod, providersPerRou, allProvidersPerReq, httpMethod);
            const routeMeta: OasRouteMeta = {
              httpMethod,
              path,
              oasPath: oasRoute.path,
              pathItem: oasRoute.pathItem,
              params,
              paramsRefs,
              decoratorMetadata,
              controller,
              methodName,
              parseBody,
              guards,
            };
            providersPerRou.push({ provide: edk.RouteMeta, useValue: routeMeta });
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
    providersPerReq: ServiceProvider[],
    methodName: string,
    normalizedGuards: edk.NormalizedGuard[],
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

  protected mergeParams(pathItem: XPathItemObject, httpMethod: HttpMethod) {
    const operationObject: OperationObject = pathItem[httpMethod.toLowerCase()];
    const parameterObjects: ParameterObject[] = [];
    const referenceObjects: ReferenceObject[] = [];
    const parameters: (ParameterObject | ReferenceObject)[] = [];
    parameters.push(...(pathItem.parameters || []), ...(operationObject.parameters || []));
    parameters.forEach((p) => {
      if (isReferenceObject(p)) {
        referenceObjects.push(p);
      } else {
        parameterObjects.push(p);
      }
    });
    return {
      params: getLastParameterObjects(parameterObjects),
      paramsRefs: getLastReferenceObjects(referenceObjects),
    };
  }

  protected transformPath(path: string, params: ParameterObject[]) {
    const paramsInPath = params.filter(p => p.in == 'path').map(p => p.name);

    paramsInPath.forEach(name => {
      path = path.replace(`{${name}}`, `:${name}`);
    });

    return path;
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
