import { ClassProvider, ExistingProvider, FactoryProvider, Provider, Type, TypeProvider, ValueProvider } from 'ts-di';

import { normalizeProviders } from './ng-utils';
import { ServerOptions, Http2SecureServerOptions, ModuleWithProviders, ObjectAny } from '../types/types';
import { ModuleDecorator } from '../decorators/module';
import { RootModuleDecorator } from '../decorators/root-module';
import { ControllerDecorator } from '../decorators/controller';
import { RouteMetadata } from '../decorators/route';

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isModuleWithProviders(
  impOrExp: Type<any> | ModuleWithProviders<{}> | any[]
): impOrExp is ModuleWithProviders<{}> {
  return (impOrExp as ModuleWithProviders<{}>).module !== undefined;
}

export function isRootModule(moduleMetadata: RootModuleDecorator): moduleMetadata is RootModuleDecorator {
  return (moduleMetadata as any)?.ngMetadataName == 'RootModule';
}

export function isModule(moduleMetadata: ModuleDecorator): moduleMetadata is ModuleDecorator {
  return (moduleMetadata as any)?.ngMetadataName == 'Module';
}

export function isController(ctrlMeatada: ControllerDecorator): ctrlMeatada is ControllerDecorator {
  return (ctrlMeatada as any)?.ngMetadataName == 'Controller';
}

export function isEntity(metadata: ObjectAny): metadata is ObjectAny {
  return (metadata as any)?.ngMetadataName == 'Entity';
}

export function isColumn(metadata: ObjectAny): metadata is ObjectAny {
  return (metadata as any)?.ngMetadataName == 'Column';
}

export function isRoute(propMeatada: RouteMetadata): propMeatada is RouteMetadata {
  return (propMeatada as any)?.ngMetadataName == 'Route';
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

export function isProvider(provider: Provider): provider is Provider {
  provider = Array.isArray(provider) ? provider : [provider];
  const arrProviders = normalizeProviders(provider);

  return arrProviders.every(ok);

  /**
   * TypeProvider there is normalized to other form Provider
   */
  function ok(prov: Provider) {
    return isValueProvider(prov) || isClassProvider(prov) || isExistingProvider(prov) || isFactoryProvider(prov);
  }
}
