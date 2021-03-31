import { Injectable, Provider, ReflectiveInjector, ResolvedReflectiveProvider, TypeProvider } from '@ts-stack/di';

import { ControllerMetadata } from '../decorators/controller';
import { BodyParserConfig } from '../models/body-parser-config';
import { ExtensionMetadata } from '../types/extension-metadata';
import { GuardItem } from '../types/guard-item';
import { NormalizedGuard } from '../types/normalized-guard';
import { RouteData } from '../types/route-data';
import { isController, isRoute } from '../utils/type-guards';

@Injectable()
export class PreRoutes {
  protected providersPerReq: Provider[];
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];

  constructor(protected injectorPerApp: ReflectiveInjector) {}

  getRoutesData(extensionMetadata: ExtensionMetadata) {
    const {
      controllersMetadata,
      guardsPerMod,
      moduleMetadata: { providersPerMod, providersPerReq, name },
    } = extensionMetadata;
    const injectorPerMod = this.injectorPerApp.resolveAndCreateChild(providersPerMod);

    this.providersPerReq = providersPerReq;
    this.resolveProvidersPerReq();
    const routesData: RouteData[] = [];
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
          const resolvedProvidersPerReq = this.getResolvedProvidersPerReq(
            name,
            controller,
            ctrlDecorValue,
            methodName,
            guards
          );
          const injectorPerReq = injectorPerMod.createChildFromResolved(resolvedProvidersPerReq);
          const bodyParserConfig = injectorPerReq.get(BodyParserConfig) as BodyParserConfig;
          const parseBody = bodyParserConfig.acceptMethods.includes(route.httpMethod);

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
   * Resolve providers per the request.
   */
  protected resolveProvidersPerReq() {
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
  }

  /**
   * Inserts new `Provider` at the start of `providersPerReq` array.
   */
  protected unshiftProvidersPerReq(...providers: Provider[]) {
    this.providersPerReq.unshift(...providers);
    this.resolveProvidersPerReq();
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
    Ctrl: TypeProvider,
    controllerMetadata: ControllerMetadata,
    methodName: string,
    normalizedGuards: NormalizedGuard[]
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
