import { ChainError } from '@ts-stack/chain-error';
import {
  ClassProvider,
  FactoryProvider,
  forwardRef,
  ForwardRefFn,
  InjectionToken,
  Provider,
  Type,
  TypeProvider,
  ValueProvider,
  TokenProvider,
} from '@ts-stack/di';
import { Container, reflector } from '@ts-stack/di';

import { featureModule } from '../decorators/module';
import { controller, ControllerMetadata } from '../decorators/controller';
import { route, RouteMetadata } from '../decorators/route';
import { rootModule } from '../decorators/root-module';
import { AnyObj, ModuleType, ModuleWithParams, ServiceProvider, Extension, AnyFn } from '../types/mix';
import { AppendsWithParams, ModuleMetadata } from '../types/module-metadata';
import { RootModuleMetadata } from '../types/root-module-metadata';
import { Http2SecureServerOptions, ServerOptions } from '../types/server-options';
import { NormalizedProvider } from './ng-utils';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isForwardRef(type: any): type is ForwardRefFn {
  return typeof type == 'function' && type.__forward_ref__ === forwardRef;
}

export function isChainError<T extends AnyObj>(err: any): err is ChainError<T> {
  return err instanceof ChainError;
}

export function isFeatureModule(container: Container): container is Container<ModuleMetadata> {
  return container?.factory === featureModule;
}

export function isRootModule(container: Container): container is Container<RootModuleMetadata> {
  return container?.factory === rootModule;
}

export function isRawRootModule(
  rawModule: RootModuleMetadata & { decoratorFactory?: AnyFn }
): rawModule is RootModuleMetadata {
  return rawModule.decoratorFactory === rootModule;
}

export function isNormRootModule(
  rawModule: NormalizedModuleMetadata
): rawModule is NormalizedModuleMetadata<RootModuleMetadata> {
  return rawModule.decoratorFactory === rootModule;
}

export function isController(container: AnyObj): container is Container<ControllerMetadata> {
  return container?.factory === controller;
}

export function isRoute(container: AnyObj): container is Container<RouteMetadata> {
  return container?.factory === route;
}

export function isModuleWithParams(mod: ServiceProvider | ModuleWithParams | ModuleType): mod is ModuleWithParams {
  return (mod as ModuleWithParams)?.module !== undefined;
}

export function isAppendsWithParams(mod: ModuleType | ModuleWithParams | AppendsWithParams): mod is AppendsWithParams {
  return (mod as AppendsWithParams)?.module !== undefined && (mod as AppendsWithParams)?.path !== undefined;
}

export function isInjectionToken(token: any): token is InjectionToken<any> {
  return token instanceof InjectionToken;
}

export function isExtensionProvider(provider: Provider): provider is Type<Extension<any>> {
  const init = (provider as Type<Extension<any>>)?.prototype?.init;
  return typeof init == 'function';
}

export function isTypeProvider(provider: Provider): provider is TypeProvider {
  return provider instanceof Type;
}

export function isValueProvider(provider: Provider): provider is ValueProvider {
  return (provider as ValueProvider)?.useValue !== undefined;
}

export function isClassProvider(provider: Provider): provider is ClassProvider {
  return (provider as ClassProvider)?.useClass !== undefined;
}

export function isTokenProvider(provider: Provider): provider is TokenProvider {
  return (provider as TokenProvider)?.useToken !== undefined;
}

export function isFactoryProvider(provider: Provider): provider is FactoryProvider {
  return (provider as FactoryProvider)?.useFactory !== undefined;
}

export type MultiProvider = Exclude<ServiceProvider, TypeProvider> & { multi: boolean };

export function isMultiProvider(provider: Provider): provider is MultiProvider {
  return (
    (provider as ValueProvider)?.token !== undefined &&
    (provider as ValueProvider)?.multi !== undefined &&
    ((provider as ValueProvider)?.useValue !== undefined ||
      (provider as ClassProvider)?.useClass !== undefined ||
      (provider as TokenProvider)?.useToken !== undefined ||
      (provider as FactoryProvider)?.useFactory !== undefined)
  );
}

export function isProvider(maybeProvider: any): maybeProvider is ServiceProvider {
  if (isModuleWithParams(maybeProvider)) {
    return false;
  }
  const isSomeModule = reflector.getClassMetadata(maybeProvider).some((m) => isRootModule(m) || isFeatureModule(m));
  return (maybeProvider instanceof Type && !isSomeModule) || isNormalizedProvider(maybeProvider);
}

/**
 * Returns true if providers declares in format:
 * ```ts
 * { token: SomeClas, useClass: OtherClass }
 * ```
 */
export function isNormalizedProvider(provider: ServiceProvider): provider is NormalizedProvider {
  return ok(provider);

  /**
   * TypeProvider there is normalized to other form Provider
   */
  function ok(prov: Provider) {
    return isValueProvider(prov) || isClassProvider(prov) || isTokenProvider(prov) || isFactoryProvider(prov);
  }
}
