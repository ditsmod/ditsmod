import { ChainError } from '@ts-stack/chain-error';

import { Provider, Class, DecoratorAndValue, reflector, isNormalizedProvider } from '#di';
import { AnyObj, RequireProps } from '#types/mix.js';
import { ModuleRawMetadata, ModuleWithParams } from '#decorators/module-raw-metadata.js';
import { RootRawMetadata } from '#decorators/module-raw-metadata.js';
import { InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { CustomError } from '#error/custom-error.js';
import { BaseMeta } from '#types/base-meta.js';

export interface TypeGuard<T> {
  (arg: any): arg is T;
}

export function isChainError<T extends AnyObj>(err: any): err is ChainError<T> {
  return err instanceof ChainError;
}

export function isCustomError(err: any): err is CustomError {
  return err instanceof CustomError;
}
export function isParamsWithMwp(arg?: AnyObj): arg is { mwp: ModuleWithParams } {
  return isModuleWithParams((arg as { mwp: ModuleWithParams } | undefined)?.mwp);
}

export function isRootModule(decorAndVal?: DecoratorAndValue): decorAndVal is DecoratorAndValue<RootRawMetadata>;
export function isRootModule(baseMeta?: BaseMeta): baseMeta is BaseMeta<RootRawMetadata>;
export function isRootModule(rawMeta?: RootRawMetadata): rawMeta is RootRawMetadata;
export function isRootModule(
  arg?: DecoratorAndValue | RootRawMetadata | BaseMeta,
): arg is DecoratorAndValue<RootRawMetadata> {
  if (arg instanceof DecoratorAndValue) {
    return arg.value instanceof RootRawMetadata;
  } else if (arg instanceof BaseMeta) {
    return arg.rawMeta instanceof RootRawMetadata;
  }
  return arg instanceof RootRawMetadata;
}

export function isFeatureModule(arg?: DecoratorAndValue): arg is DecoratorAndValue<ModuleRawMetadata>;
export function isFeatureModule(baseMeta?: BaseMeta): baseMeta is BaseMeta<ModuleRawMetadata>;
export function isFeatureModule(arg?: ModuleRawMetadata): arg is ModuleRawMetadata;
export function isFeatureModule(
  arg?: DecoratorAndValue | ModuleRawMetadata | BaseMeta,
): arg is DecoratorAndValue<ModuleRawMetadata> {
  if (arg instanceof DecoratorAndValue) {
    return arg.value instanceof ModuleRawMetadata;
  } else if (arg instanceof BaseMeta) {
    return arg.rawMeta instanceof ModuleRawMetadata;
  }
  return arg instanceof ModuleRawMetadata;
}

export function isModDecor(arg?: DecoratorAndValue): arg is DecoratorAndValue<RootRawMetadata>;
export function isModDecor(arg?: RootRawMetadata): arg is RootRawMetadata;
export function isModDecor(arg?: any) {
  return isRootModule(arg) || isFeatureModule(arg);
}

export function isModuleWithInitHooks(metadata?: InitHooks<AnyObj>): metadata is InitHooks<AnyObj>;
export function isModuleWithInitHooks(arg?: DecoratorAndValue): arg is DecoratorAndValue<InitHooks<AnyObj>>;
export function isModuleWithInitHooks(
  arg?: DecoratorAndValue | InitHooks<AnyObj>,
): arg is DecoratorAndValue<InitHooks<AnyObj>> {
  if (arg instanceof DecoratorAndValue) {
    return (arg as DecoratorAndValue<InitHooks<AnyObj>>).value instanceof InitHooks;
  } else {
    return arg instanceof InitHooks;
  }
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

export function isModuleWithParams(modRefId?: AnyObj): modRefId is ModuleWithParams {
  return (modRefId as ModuleWithParams)?.module !== undefined;
}

export function isProvider(maybeProvider?: any): maybeProvider is Provider {
  if (isModuleWithParams(maybeProvider)) {
    return false;
  }
  const isSomeModule = reflector.getDecorators(maybeProvider, isModDecor);
  return (maybeProvider instanceof Class && !isSomeModule) || isNormalizedProvider(maybeProvider);
}
