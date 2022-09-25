import { ChainError } from '@ts-stack/chain-error';
import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  forwardRef,
  ForwardRefFn,
  InjectionToken,
  Provider,
  reflector,
  Type,
  TypeProvider,
  ValueProvider,
} from '@ts-stack/di';

import { ControllerMetadata } from '../decorators/controller';
import { RouteMetadata } from '../decorators/route';
import { AnyObj, ModuleType, ModuleWithParams, ServiceProvider, Extension } from '../types/mix';
import { ModuleMetadata } from '../types/module-metadata';
import { RootModuleMetadata } from '../types/root-module-metadata';
import { Http2SecureServerOptions, ServerOptions } from '../types/server-options';
import { NormalizedProvider } from './ng-utils';

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isForwardRef(type: any): type is ForwardRefFn {
  return typeof type == 'function' && type.hasOwnProperty('__forward_ref__') && type.__forward_ref__ === forwardRef;
}

export function isChainError<T extends AnyObj>(err: any): err is ChainError<T> {
  return err instanceof ChainError;
}

export function isModule(moduleMetadata: AnyObj): moduleMetadata is ModuleMetadata {
  return (moduleMetadata as any)?.ngMetadataName == 'Module';
}

export function isRootModule(moduleMetadata: AnyObj): moduleMetadata is RootModuleMetadata {
  return (moduleMetadata as any)?.ngMetadataName == 'RootModule';
}

export function isController(ctrlMeatada: AnyObj): ctrlMeatada is ControllerMetadata {
  return (ctrlMeatada as any)?.ngMetadataName == 'Controller';
}

export function isRoute(propMeatada: AnyObj): propMeatada is RouteMetadata {
  return (propMeatada as any)?.ngMetadataName == 'Route';
}

export function isModuleWithParams(mod: ServiceProvider | ModuleWithParams | ModuleType): mod is ModuleWithParams {
  return (mod as ModuleWithParams)?.module !== undefined;
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

export function isExistingProvider(provider: Provider): provider is ExistingProvider {
  return (provider as ExistingProvider)?.useExisting !== undefined;
}

export function isFactoryProvider(provider: Provider): provider is FactoryProvider {
  return (provider as FactoryProvider)?.useFactory !== undefined;
}

export type MultiProvider = Exclude<ServiceProvider, TypeProvider> & { multi: boolean };

export function isMultiProvider(provider: Provider): provider is MultiProvider {
  return (
    (provider as ValueProvider)?.provide !== undefined &&
    (provider as ValueProvider)?.multi !== undefined &&
    ((provider as ValueProvider)?.useValue !== undefined ||
      (provider as ClassProvider)?.useClass !== undefined ||
      (provider as ExistingProvider)?.useExisting !== undefined ||
      (provider as FactoryProvider)?.useFactory !== undefined)
  );
}

export function isProvider(maybeProvider: any): maybeProvider is ServiceProvider {
  if (isModuleWithParams(maybeProvider)) {
    return false;
  }
  const isSomeModule = reflector.annotations(maybeProvider).some((m) => isRootModule(m) || isModule(m));
  return (maybeProvider instanceof Type && !isSomeModule) || isNormalizedProvider(maybeProvider);
}

/**
 * Returns true if providers declares in format:
 * ```ts
 * { provide: SomeClas, useClass: OtherClass }
 * ```
 */
export function isNormalizedProvider(provider: ServiceProvider): provider is NormalizedProvider {

  return ok(provider);

  /**
   * TypeProvider there is normalized to other form Provider
   */
  function ok(prov: Provider) {
    return isValueProvider(prov) || isClassProvider(prov) || isExistingProvider(prov) || isFactoryProvider(prov);
  }
}
