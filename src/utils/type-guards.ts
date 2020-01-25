import { ClassProvider, ExistingProvider, FactoryProvider, Provider, Type, TypeProvider, ValueProvider } from 'ts-di';

import { normalizeProviders } from './ng-utils';
import { ServerOptions, Http2SecureServerOptions, ModuleWithProviders } from '../types';

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isModuleWithProviders(
  impOrExp: Type<any> | ModuleWithProviders<{}> | any[]
): impOrExp is ModuleWithProviders<{}> {
  return (impOrExp as ModuleWithProviders<{}>).module !== undefined;
}

export function isTypeProvider(provider: Provider): provider is TypeProvider {
  return provider instanceof Type;
}

export function isValueProvider(provider: Provider): provider is ValueProvider {
  return provider && (provider as ValueProvider).useValue !== undefined;
}

export function isClassProvider(provider: Provider): provider is ClassProvider {
  return provider && (provider as ClassProvider).useClass !== undefined;
}

export function isExistingProvider(provider: Provider): provider is ExistingProvider {
  return provider && (provider as ExistingProvider).useExisting !== undefined;
}

export function isFactoryProvider(provider: Provider): provider is FactoryProvider {
  return provider && (provider as FactoryProvider).useFactory !== undefined;
}

export function isProvider(provider: Provider): provider is Provider {
  provider = Array.isArray(provider) ? provider : [provider];
  const arrProviders = normalizeProviders(provider as any);

  return arrProviders.every(ok);

  /**
   * TypeProvider there is normalized to other form Provider
   */
  function ok(prov: Provider) {
    return isValueProvider(prov) || isClassProvider(prov) || isExistingProvider(prov) || isFactoryProvider(prov);
  }
}
