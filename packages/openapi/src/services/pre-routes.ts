import { Injectable, Provider, ReflectiveInjector, ResolvedReflectiveProvider, TypeProvider } from '@ts-stack/di';
import { edk, GuardItem, HttpMethod } from '@ditsmod/core';

import { isOasRoute } from '../utils/type-guards';
import { OasRouteData } from '../types/oas-route-data';

@Injectable()
export class PreRoutes {
  protected providersPerReq: Provider[];
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];

  constructor(private injectorPerApp: ReflectiveInjector) {}

  getRoutesData(extensionMetadata: edk.ExtensionMetadata) {
    const {
      controllersMetadata,
      guardsPerMod,
      moduleMetadata: { providersPerMod, providersPerReq, name },
    } = extensionMetadata;
    const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);

    this.providersPerReq = providersPerReq;
    this.initProvidersPerReq();
    const allHttpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
    const routesData: OasRouteData[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          if (!isOasRoute(decoratorMetadata.value)) {
            continue;
          }
          const route = decoratorMetadata.value;
          const ctrlDecorValue = ctrlDecorValues.find(edk.isController);
          const httpMethods = Object.keys(route.pathItem).filter((key) => allHttpMethods.includes(key)) as HttpMethod[];
          const guards = [...guardsPerMod, ...this.normalizeGuards(route.guards)];
          const resolvedProvidersPerReq = this.getResolvedProvidersPerReq(
            name,
            controller,
            ctrlDecorValue,
            methodName,
            guards
          );

          httpMethods.forEach((httpMethod) => {
            routesData.push({
              path: route.path,
              parameters: route.pathItem[httpMethod].parameters,
              decoratorMetadata,
              controller,
              methodName,
              httpMethod,
              providers: resolvedProvidersPerReq,
              injector: injectorPerMod,
              guards,
            });
          });
        }
      }
    }

    return routesData;
  }

  /**
   * Init providers per the request.
   */
  protected initProvidersPerReq() {
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
  }

  /**
   * Inserts new `Provider` at the start of `providersPerReq` array.
   */
  protected unshiftProvidersPerReq(...providers: Provider[]) {
    this.providersPerReq.unshift(...providers);
    this.initProvidersPerReq();
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

  protected getResolvedProvidersPerReq(
    moduleName: string,
    Ctrl: TypeProvider,
    controllerMetadata: edk.ControllerMetadata,
    methodName: string,
    normalizedGuards: edk.NormalizedGuard[]
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

    this.unshiftProvidersPerReq(Ctrl, guards);
    let resolvedProvidersPerReq: ResolvedReflectiveProvider[] = this.resolvedProvidersPerReq;
    const { providersPerReq } = controllerMetadata;
    if (providersPerReq) {
      resolvedProvidersPerReq = ReflectiveInjector.resolve([...this.providersPerReq, ...providersPerReq]);
    }

    return resolvedProvidersPerReq;
  }
}
