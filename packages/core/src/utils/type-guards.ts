import { ChainError } from '@ts-stack/chain-error';

import { Provider, Class, DecoratorAndValue, reflector, isNormalizedProvider } from '#di';
import { AnyObj, RequireProps } from '#types/mix.js';
import { ModuleRawMetadata, ModuleWithParams } from '#decorators/module-raw-metadata.js';
import { featureModule } from '#decorators/feature-module.js';
import { RootRawMetadata } from '#decorators/module-raw-metadata.js';
import { InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { CustomError } from '#error/custom-error.js';
import { BaseMeta } from '#types/base-meta.js';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { rootModule } from '#decorators/root-module.js';

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
export function isRootModule(rawMeta?: RootRawMetadata): rawMeta is RootRawMetadata;
export function isRootModule(baseMeta?: BaseMeta): baseMeta is BaseMeta<RootModuleMetadata>;
export function isRootModule(arg?: AnyObj): arg is { decorator: typeof rootModule } & AnyObj;
export function isRootModule(arg?: DecoratorAndValue | RootRawMetadata | BaseMeta | AnyObj): arg is DecoratorAndValue<RootRawMetadata> {
  if (arg instanceof DecoratorAndValue) {
    return arg.value instanceof RootRawMetadata;
  }
  return arg instanceof RootRawMetadata;
}

export function isFeatureModule(arg?: DecoratorAndValue): arg is DecoratorAndValue<RootRawMetadata>;
export function isFeatureModule(arg?: RootRawMetadata): arg is RootRawMetadata;
export function isFeatureModule(meta?: BaseMeta): meta is BaseMeta<ModuleRawMetadata>;
export function isFeatureModule(arg?: AnyObj): arg is { decorator: typeof featureModule } & AnyObj;
export function isFeatureModule(
  arg?: DecoratorAndValue | RootRawMetadata | BaseMeta | AnyObj,
): arg is DecoratorAndValue<RootRawMetadata> {
  if (arg instanceof DecoratorAndValue) {
    return arg.value instanceof RootRawMetadata;
  }
  return arg instanceof RootRawMetadata;
}

export function isModDecor(arg?: DecoratorAndValue): arg is DecoratorAndValue<RootRawMetadata>;
export function isModDecor(arg?: RootRawMetadata): arg is RootRawMetadata;
export function isModDecor(meta?: BaseMeta): meta is BaseMeta<RootModuleMetadata>;
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
