import { Injectable, Provider, ReflectiveInjector, ResolvedReflectiveProvider, TypeProvider } from '@ts-stack/di';
import { BodyParserConfig, edk, GuardItem } from '@ditsmod/core';

import { isOasRoute } from './utils/type-guards';

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
    const routesData: edk.RouteData[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorMetadata of methodWithDecorators) {
          if (!isOasRoute(decoratorMetadata.value)) {
            continue;
          }
          const route = decoratorMetadata.value;
          const ctrlDecorValue = ctrlDecorValues.find(edk.isController);
          const resolvedProvidersPerReq = this.getResolvedProvidersPerReq(
            name,
            guardsPerMod,
            controller,
            ctrlDecorValue,
            methodName,
            route
          );
          const injectorPerReq = injectorPerMod.createChildFromResolved(resolvedProvidersPerReq);
          const bodyParserConfig = injectorPerReq.get(BodyParserConfig) as BodyParserConfig;
          const parseBody = bodyParserConfig.acceptMethods.includes(route.httpMethod);
          const guards = [...guardsPerMod, ...this.normalizeGuards(route.guards)];

          routesData.push({
            decoratorMetadata,
            controller,
            methodName,
            route,
            providers: resolvedProvidersPerReq,
            injector: injectorPerMod,
            parseBody,
            guards,
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
    guardsPerMod: edk.NormalizedGuard[],
    Ctrl: TypeProvider,
    controllerMetadata: edk.ControllerMetadata,
    methodName: string,
    route: edk.RouteMetadata
  ) {
    const guards = [...guardsPerMod.map((n) => n.guard), ...route.guards].map((item) => {
      if (Array.isArray(item)) {
        return item[0];
      } else {
        return item;
      }
    });

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
