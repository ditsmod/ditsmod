import { ChainError } from '@ts-stack/chain-error';
import { Provider, Class, DecoratorAndValue, reflector, isNormalizedProvider } from '#di';
import { AnyObj, ModuleType, RequireProps } from '#types/mix.js';
import { ModuleWithParams } from '#types/module-metadata.js';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { Http2SecureServerOptions, ServerOptions } from '#types/server-options.js';
import { featureModule } from '#decorators/module.js';
import { RawMeta } from '../decorators/module.js';
import { controller, ControllerRawMetadata } from '#decorators/controller.js';
import { rootModule } from '#decorators/root-module.js';
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

export function isFeatureModule(
  decoratorAndValue?: DecoratorAndValue,
): decoratorAndValue is DecoratorAndValue<RawMeta> {
  return decoratorAndValue?.decorator === featureModule;
}

export function isRootModule(arg?: DecoratorAndValue): arg is DecoratorAndValue<RawMeta>;
export function isRootModule(arg?: RawMeta): arg is RawMeta;
export function isRootModule(meta?: NormalizedModuleMetadata): meta is NormalizedModuleMetadata<RootModuleMetadata>;
export function isRootModule(
  arg?: DecoratorAndValue | RawMeta | NormalizedModuleMetadata,
): arg is DecoratorAndValue<RawMeta> {
  return arg?.decorator === rootModule;
}

export function isModDecor(
  decoratorAndValue?: DecoratorAndValue,
): decoratorAndValue is DecoratorAndValue<RawMeta> | DecoratorAndValue<RawMeta> {
  return isRootModule(decoratorAndValue) || isFeatureModule(decoratorAndValue);
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

export function isCtrlDecor(decoratorAndValue?: AnyObj): decoratorAndValue is DecoratorAndValue<ControllerRawMetadata> {
  return decoratorAndValue?.decorator === controller;
}

export function isModuleWithParams(modRefId?: Provider | ModuleWithParams | ModuleType): modRefId is ModuleWithParams {
  return (modRefId as ModuleWithParams)?.module !== undefined;
}

export function isProvider(maybeProvider?: any): maybeProvider is Provider {
  if (isModuleWithParams(maybeProvider)) {
    return false;
  }
  const isSomeModule = reflector.getDecorators(maybeProvider, isModDecor);
  return (maybeProvider instanceof Class && !isSomeModule) || isNormalizedProvider(maybeProvider);
}
