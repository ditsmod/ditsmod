import { ChainError } from '@ts-stack/chain-error';
import {
  ClassProvider,
  FactoryProvider,
  InjectionToken,
  Provider,
  Class,
  TypeProvider,
  ValueProvider,
  TokenProvider,
  DecoratorAndValue,
  reflector,
} from '../di';
import { featureModule } from '../decorators/module';
import { controller, ControllerMetadata } from '../decorators/controller';
import { route } from '../decorators/route';
import { rootModule } from '../decorators/root-module';
import {
  AnyObj,
  ModuleType,
  ModuleWithParams,
  ServiceProvider,
  Extension,
  AnyFn,
  DecoratorMetadata,
} from '../types/mix';
import { AppendsWithParams, ModuleMetadata } from '../types/module-metadata';
import { RootModuleMetadata } from '../types/root-module-metadata';
import { Http2SecureServerOptions, ServerOptions } from '../types/server-options';
import { NormalizedProvider } from './ng-utils';
import { NormalizedModuleMetadata } from '../models/normalized-module-metadata';

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isChainError<T extends AnyObj>(err: any): err is ChainError<T> {
  return err instanceof ChainError;
}

export function isFeatureModule(
  decoratorAndValue: DecoratorAndValue
): decoratorAndValue is DecoratorAndValue<ModuleMetadata> {
  return decoratorAndValue?.decorator === featureModule;
}

export function isRootModule(
  decoratorAndValue: DecoratorAndValue
): decoratorAndValue is DecoratorAndValue<RootModuleMetadata> {
  return decoratorAndValue?.decorator === rootModule;
}

export function isDecoratorAndValue(
  decoratorAndValue: DecoratorAndValue | Class
): decoratorAndValue is DecoratorAndValue {
  return (
    (decoratorAndValue as DecoratorAndValue)?.decorator !== undefined && decoratorAndValue?.hasOwnProperty('value')
  );
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

export function isController(decoratorAndValue: AnyObj): decoratorAndValue is DecoratorAndValue<ControllerMetadata> {
  return decoratorAndValue?.decorator === controller;
}

export function isRoute(container: AnyObj): container is DecoratorMetadata {
  return (container as DecoratorMetadata)?.decorator === route;
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

export function isExtensionProvider(provider: Provider): provider is Class<Extension<any>> {
  const init = (provider as Class<Extension<any>>)?.prototype?.init;
  return typeof init == 'function';
}

export function isTypeProvider(provider: Provider): provider is TypeProvider {
  return provider instanceof Class;
}

export function isValueProvider(provider: Provider): provider is ValueProvider {
  return provider.hasOwnProperty('useValue');
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
  return (maybeProvider instanceof Class && !isSomeModule) || isNormalizedProvider(maybeProvider);
}

/**
 * Returns true if providers declares in format:
 * ```ts
 * { token: SomeClas, useClass: OtherClass }
 * ```
 */
export function isNormalizedProvider(provider: Provider): provider is NormalizedProvider {
  return (
    isValueProvider(provider) || isClassProvider(provider) || isTokenProvider(provider) || isFactoryProvider(provider)
  );
}
