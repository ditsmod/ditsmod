import {
  ClassProvider,
  ExistingProvider,
  FactoryProvider,
  Provider,
  reflector,
  Type,
  TypeProvider,
  ValueProvider,
} from '@ts-stack/di';

import { ControllerMetadata } from '../decorators/controller';
import { RouteMetadata } from '../decorators/route';
import { AnyObj } from '../types/any-obj';
import { ExtensionType } from '../types/extension-type';
import { ModuleMetadata } from '../types/module-metadata';
import { ModuleWithParams } from '../types/module-with-params';
import { NormalizedProvider } from '../types/normalized-provider';
import { RootModuleMetadata } from '../types/root-module-metadata';
import { ServiceProvider } from '../types/service-provider';

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

export function isModuleWithParams(mod: ServiceProvider | ModuleWithParams<any>): mod is ModuleWithParams<any> {
  return (mod as ModuleWithParams<any>)?.module !== undefined;
}

export function isExtensionProvider(provider: Provider): provider is ExtensionType {
  const init = (provider as ExtensionType)?.prototype?.init;
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

export function isProvider(maybeProvider: any): maybeProvider is TypeProvider | NormalizedProvider {
  let module: any;
  if (isModuleWithParams(maybeProvider)) {
    module = maybeProvider.module;
  } else {
    module = maybeProvider;
  }
  const isSomeModule = reflector.annotations(module).some((m) => isRootModule(m) || isModule(m));

  return (maybeProvider instanceof Type && !isSomeModule) || isNormalizedProvider(maybeProvider);
}

/**
 * Returns true if providers declares in format:
 * ```ts
 * { provide: SomeClas, useClass: OtherClass }
 * ```
 */
export function isNormalizedProvider(provider: Provider): provider is NormalizedProvider {
  const providers = Array.isArray(provider) ? provider : [provider];

  return providers.every(ok);

  /**
   * TypeProvider there is normalized to other form Provider
   */
  function ok(prov: Provider) {
    return isValueProvider(prov) || isClassProvider(prov) || isExistingProvider(prov) || isFactoryProvider(prov);
  }
}
