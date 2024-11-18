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
import { AnyObj, ModuleType, AnyFn, RequireProps } from '#types/mix.js';
import { ModuleWithParams, AppendsWithParams, ModuleMetadata } from '#types/module-metadata.js';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { Http2SecureServerOptions, ServerOptions } from '#types/server-options.js';
import { featureModule } from '#decorators/module.js';
import { controller, ControllerRawMetadata } from '#decorators/controller.js';
import { rootModule } from '#decorators/root-module.js';
import { NormalizedProvider } from './ng-utils.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import { CustomError } from '#error/custom-error.js';

export interface TypeGuard<T> {
  (arg: any): arg is T;
}

export function isHttp2SecureServerOptions(serverOptions: ServerOptions): serverOptions is Http2SecureServerOptions {
  return (serverOptions as Http2SecureServerOptions).isHttp2SecureServer;
}

export function isChainError<T extends AnyObj>(err: any): err is ChainError<T> {
  return err instanceof ChainError;
}

export function isCustomError(err: any): err is CustomError {
  return err instanceof CustomError;
}

export function isFeatureModDecor(
  decoratorAndValue?: DecoratorAndValue,
): decoratorAndValue is DecoratorAndValue<ModuleMetadata> {
  return decoratorAndValue?.decorator === featureModule;
}

export function isRootModDecor(
  decoratorAndValue?: DecoratorAndValue,
): decoratorAndValue is DecoratorAndValue<RootModuleMetadata> {
  return decoratorAndValue?.decorator === rootModule;
}

export function isModDecor(
  decoratorAndValue?: DecoratorAndValue,
): decoratorAndValue is DecoratorAndValue<RootModuleMetadata> | DecoratorAndValue<ModuleMetadata> {
  return isRootModDecor(decoratorAndValue) || isFeatureModDecor(decoratorAndValue);
}

/**
 * If this guard returns `true`, then the `DecoratorAndValue`
 * instance passed to it has the `declaredInDir` property set.
 */
export function hasDeclaredInDir(
  decoratorAndValue?: DecoratorAndValue,
): decoratorAndValue is RequireProps<DecoratorAndValue, 'declaredInDir'> {
  return Boolean(decoratorAndValue?.declaredInDir) && decoratorAndValue?.declaredInDir != '.';
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
  rawModule?: RootModuleMetadata & { decorator?: AnyFn },
): rawModule is RootModuleMetadata {
  return rawModule?.decorator === rootModule;
}

export function isNormRootModule(
  rawModule?: NormalizedModuleMetadata,
): rawModule is NormalizedModuleMetadata<RootModuleMetadata> {
  return rawModule?.decorator === rootModule;
}

export function isCtrlDecor(
  decoratorAndValue?: AnyObj,
): decoratorAndValue is DecoratorAndValue<ControllerRawMetadata> {
  return decoratorAndValue?.decorator === controller;
}

export function isModuleWithParams(modRefId?: Provider | ModuleWithParams | ModuleType): modRefId is ModuleWithParams {
  return (modRefId as ModuleWithParams)?.module !== undefined;
}

export function isAppendsWithParams(
  modRefId?: ModuleType | ModuleWithParams | AppendsWithParams,
): modRefId is AppendsWithParams {
  return (
    (modRefId as AppendsWithParams)?.module !== undefined &&
    ((modRefId as AppendsWithParams)?.path !== undefined || (modRefId as AppendsWithParams)?.absolutePath !== undefined)
  );
}

export function isInjectionToken(token?: any): token is InjectionToken<any> {
  return token instanceof InjectionToken;
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
  const isSomeModule = reflector.getDecorators(maybeProvider, isModDecor);
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
