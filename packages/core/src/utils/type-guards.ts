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
  ClassFactoryProvider,
} from '#di';
import { AnyObj, ModuleType, AnyFn } from '#types/mix.js';
import { ModuleWithParams, AppendsWithParams, ModuleMetadata } from '#types/module-metadata.js';
import { Extension } from '#types/extension-types.js';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { Http2SecureServerOptions, ServerOptions } from '#types/server-options.js';
import { featureModule } from '#decorators/module.js';
import { controller, ControllerRawMetadata } from '#decorators/controller.js';
import { route } from '#decorators/route.js';
import { rootModule } from '#decorators/root-module.js';
import { NormalizedProvider } from './ng-utils.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isChainError<T extends AnyObj>(err: any): err is ChainError<T> {
  return err instanceof ChainError;
}

export function isFeatureModule(
  decoratorAndValue?: DecoratorAndValue,
): decoratorAndValue is DecoratorAndValue<ModuleMetadata> {
  return decoratorAndValue?.decorator === featureModule;
}

export function isRootModule(
  decoratorAndValue?: DecoratorAndValue,
): decoratorAndValue is DecoratorAndValue<RootModuleMetadata> {
  return decoratorAndValue?.decorator === rootModule;
}

export function isDecoratorAndValue(
  decoratorAndValue?: DecoratorAndValue | Class,
): decoratorAndValue is DecoratorAndValue {
  return (
    (decoratorAndValue as DecoratorAndValue)?.decorator !== undefined &&
    Boolean(decoratorAndValue?.hasOwnProperty('value'))
  );
}

export function isRawRootModule(
  rawModule?: RootModuleMetadata & { decoratorFactory?: AnyFn },
): rawModule is RootModuleMetadata {
  return rawModule?.decoratorFactory === rootModule;
}

export function isNormRootModule(
  rawModule?: NormalizedModuleMetadata,
): rawModule is NormalizedModuleMetadata<RootModuleMetadata> {
  return rawModule?.decoratorFactory === rootModule;
}

export function isController(
  decoratorAndValue?: AnyObj,
): decoratorAndValue is DecoratorAndValue<ControllerRawMetadata> {
  return decoratorAndValue?.decorator === controller;
}

export function isRoute(container?: DecoratorAndValue): container is DecoratorAndValue {
  return (container as DecoratorAndValue)?.decorator === route;
}

export function isModuleWithParams(mod?: Provider | ModuleWithParams | ModuleType): mod is ModuleWithParams {
  return (mod as ModuleWithParams)?.module !== undefined;
}

export function isAppendsWithParams(mod?: ModuleType | ModuleWithParams | AppendsWithParams): mod is AppendsWithParams {
  return (mod as AppendsWithParams)?.module !== undefined && (mod as AppendsWithParams)?.path !== undefined;
}

export function isInjectionToken(token?: any): token is InjectionToken<any> {
  return token instanceof InjectionToken;
}

export function isExtensionProvider(provider?: Provider): provider is Class<Extension> {
  const init = (provider as Class<Extension>)?.prototype?.init;
  return typeof init == 'function';
}

export function isTypeProvider(provider?: Provider): provider is TypeProvider {
  return provider instanceof Class;
}

export function isValueProvider(provider?: Provider): provider is ValueProvider {
  return Boolean(provider?.hasOwnProperty('useValue'));
}

export function isClassProvider(provider?: Provider): provider is ClassProvider {
  return (provider as ClassProvider)?.useClass !== undefined;
}

export function isTokenProvider(provider?: Provider): provider is TokenProvider {
  return (provider as TokenProvider)?.useToken !== undefined;
}

export function isFactoryProvider(provider?: Provider): provider is FactoryProvider {
  return (provider as FactoryProvider)?.useFactory !== undefined;
}

export function isClassFactoryProvider(provider?: Provider): provider is ClassFactoryProvider {
  return Array.isArray((provider as ClassFactoryProvider)?.useFactory);
}

export type MultiProvider = Exclude<Provider, TypeProvider> & { multi: boolean };

export function isMultiProvider(provider?: Provider): provider is MultiProvider {
  return (
    (provider as ValueProvider)?.token !== undefined &&
    (provider as ValueProvider)?.multi !== undefined &&
    ((provider as ValueProvider)?.useValue !== undefined ||
      (provider as ClassProvider)?.useClass !== undefined ||
      (provider as TokenProvider)?.useToken !== undefined ||
      (provider as FactoryProvider)?.useFactory !== undefined)
  );
}

export function isProvider(maybeProvider?: any): maybeProvider is Provider {
  if (isModuleWithParams(maybeProvider)) {
    return false;
  }
  const isSomeModule = reflector
    .getMetadata(maybeProvider)?.constructor.decorators.some((m) => isRootModule(m) || isFeatureModule(m));
  return (maybeProvider instanceof Class && !isSomeModule) || isNormalizedProvider(maybeProvider);
}

/**
 * Returns true if providers declares in format:
 * ```ts
 * { token: SomeClas, useClass: OtherClass }
 * ```
 */
export function isNormalizedProvider(provider?: Provider): provider is NormalizedProvider {
  return (
    isValueProvider(provider) || isClassProvider(provider) || isTokenProvider(provider) || isFactoryProvider(provider)
  );
}
