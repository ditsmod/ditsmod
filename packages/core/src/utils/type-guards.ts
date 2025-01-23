import { ChainError } from '@ts-stack/chain-error';

import { Provider, Class, DecoratorAndValue, reflector, isNormalizedProvider } from '#di';
import { AnyObj, ModRefId, RequireProps } from '#types/mix.js';
import { ModuleMetadata, BaseModuleWithParams } from '#types/module-metadata.js';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { featureModule } from '#decorators/module.js';
import { RawMeta } from '../decorators/feature-module.js';
import { rootModule } from '#decorators/root-module.js';
import { NormalizedMeta } from '#types/normalized-meta.js';
import { CustomError } from '#error/custom-error.js';

export interface TypeGuard<T> {
  (arg: any): arg is T;
}

export function isChainError<T extends AnyObj>(err: any): err is ChainError<T> {
  return err instanceof ChainError;
}

export function isCustomError(err: any): err is CustomError {
  return err instanceof CustomError;
}

export function isFeatureModule(arg?: DecoratorAndValue): arg is DecoratorAndValue<RawMeta>;
export function isFeatureModule(meta?: NormalizedMeta): meta is NormalizedMeta<ModuleMetadata>;
export function isFeatureModule(arg?: DecoratorAndValue | NormalizedMeta): arg is DecoratorAndValue<RawMeta> {
  return arg?.decorator === featureModule;
}

export function isRootModule(arg?: DecoratorAndValue): arg is DecoratorAndValue<RawMeta>;
export function isRootModule(arg?: RawMeta): arg is RawMeta;
export function isRootModule(meta?: NormalizedMeta): meta is NormalizedMeta<RootModuleMetadata>;
export function isRootModule(
  arg?: DecoratorAndValue | RawMeta | NormalizedMeta,
): arg is DecoratorAndValue<RawMeta> {
  return arg?.decorator === rootModule;
}

export function isModDecor(decoratorAndValue?: DecoratorAndValue) {
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

export function isModuleWithParams(modRefId?: ModRefId): modRefId is BaseModuleWithParams {
  return (modRefId as BaseModuleWithParams)?.module !== undefined;
}

export function isProvider(maybeProvider?: any): maybeProvider is Provider {
  if (isModuleWithParams(maybeProvider)) {
    return false;
  }
  const isSomeModule = reflector.getDecorators(maybeProvider, isModDecor);
  return (maybeProvider instanceof Class && !isSomeModule) || isNormalizedProvider(maybeProvider);
}
