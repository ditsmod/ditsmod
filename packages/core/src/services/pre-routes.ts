import { Injectable, Provider, ReflectiveInjector, ResolvedReflectiveProvider, TypeProvider } from '@ts-stack/di';

import { ControllerMetadata } from '../decorators/controller';
import { RouteMetadata } from '../decorators/route';
import { BodyParserConfig } from '../models/body-parser-config';
import { ExtensionMetadata } from '../types/extension-metadata';
import { GuardItem } from '../types/guard-item';
import { NormalizedGuard } from '../types/normalized-guard';
import { PreRouteData } from '../types/route-data';
import { isController, isRoute } from '../utils/type-guards';

@Injectable()
export class PreRoutes {
  protected providersPerReq: Provider[];
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];

  constructor(protected injectorPerApp: ReflectiveInjector) {}

  getPreRoutesData(extensionMetadata: ExtensionMetadata) {
    const {
      controllersMetadata,
      guardsPerMod,
      moduleMetadata: { providersPerMod, providersPerReq, name },
    } = extensionMetadata;
    const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);

    this.providersPerReq = providersPerReq;
    this.initProvidersPerReq();
    const preRoutesData: PreRouteData[] = [];
    for (const { controller, ctrlDecorValues, methods } of controllersMetadata) {
      for (const methodName in methods) {
        const methodWithDecorators = methods[methodName];
        for (const decoratorData of methodWithDecorators) {
          if (!isRoute(decoratorData.value)) {
            continue;
          }
          const route = decoratorData.value;
          const ctrlDecorValue = ctrlDecorValues.find(isController);
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

          preRoutesData.push({
            otherDecorators: decoratorData.otherDecorators,
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

    return preRoutesData;
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
        return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
      } else {
        return { guard: item } as NormalizedGuard;
      }
    });
  }

  protected getResolvedProvidersPerReq(
    moduleName: string,
    guardsPerMod: NormalizedGuard[],
    Ctrl: TypeProvider,
    controllerMetadata: ControllerMetadata,
    methodName: string,
    route: RouteMetadata
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
