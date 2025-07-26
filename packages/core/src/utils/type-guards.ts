import { ChainError } from '@ts-stack/chain-error';

import { Provider, Class, DecoratorAndValue, reflector, isNormalizedProvider } from '#di';
import { AnyObj, ModRefId, RequireProps } from '#types/mix.js';
import { ModuleWithSrcInitMeta, ModuleMetadata, ModuleWithParams } from '#types/module-metadata.js';
import { RootModuleMetadata } from '#types/root-module-metadata.js';
import { featureModule, RawMeta } from '#decorators/feature-module.js';
import { InitHooksAndRawMeta } from '#decorators/init-hooks-and-metadata.js';
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

export function isRootModule(arg?: DecoratorAndValue): arg is DecoratorAndValue<RawMeta>;
export function isRootModule(arg?: RawMeta): arg is RawMeta;
export function isRootModule(meta?: NormalizedMeta): meta is NormalizedMeta<RootModuleMetadata>;
export function isRootModule(arg?: AnyObj): arg is { decorator: typeof rootModule } & AnyObj;
export function isRootModule(
  arg?: DecoratorAndValue | RawMeta | NormalizedMeta | AnyObj,
): arg is DecoratorAndValue<RawMeta> {
  return arg?.decorator === rootModule;
}

export function isFeatureModule(arg?: DecoratorAndValue): arg is DecoratorAndValue<RawMeta>;
export function isFeatureModule(arg?: RawMeta): arg is RawMeta;
export function isFeatureModule(meta?: NormalizedMeta): meta is NormalizedMeta<ModuleMetadata>;
export function isFeatureModule(arg?: AnyObj): arg is { decorator: typeof featureModule } & AnyObj;
export function isFeatureModule(
  arg?: DecoratorAndValue | RawMeta | NormalizedMeta | AnyObj,
): arg is DecoratorAndValue<RawMeta> {
  return arg?.decorator === featureModule;
}

export function isModDecor(arg?: DecoratorAndValue): arg is DecoratorAndValue<RawMeta>;
export function isModDecor(arg?: RawMeta): arg is RawMeta;
export function isModDecor(meta?: NormalizedMeta): meta is NormalizedMeta<RootModuleMetadata>;
export function isModDecor(arg?: any) {
  return isRootModule(arg) || isFeatureModule(arg);
}

export function isModuleWithInitHooks(
  metadata?: InitHooksAndRawMeta<AnyObj>,
): metadata is InitHooksAndRawMeta<AnyObj>;
export function isModuleWithInitHooks(arg?: DecoratorAndValue): arg is DecoratorAndValue<InitHooksAndRawMeta<AnyObj>>;
export function isModuleWithInitHooks(
  arg?: DecoratorAndValue | InitHooksAndRawMeta<AnyObj>,
): arg is DecoratorAndValue<InitHooksAndRawMeta<AnyObj>> {
  if (arg instanceof DecoratorAndValue) {
    return (arg as DecoratorAndValue<InitHooksAndRawMeta<AnyObj>>).value instanceof InitHooksAndRawMeta;
  } else {
    return arg instanceof InitHooksAndRawMeta;
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

export function isParamsWithModRefId(arg?: AnyObj): arg is { modRefId: ModRefId } {
  return (arg as { modRefId: ModRefId } | undefined)?.modRefId !== undefined;
}

export function isModuleWithSrcInitMeta(modRefId?: AnyObj): modRefId is ModuleWithSrcInitMeta {
  return (modRefId as ModuleWithSrcInitMeta).srcInitMeta !== undefined;
}

export function isProvider(maybeProvider?: any): maybeProvider is Provider {
  if (isModuleWithParams(maybeProvider)) {
    return false;
  }
  const isSomeModule = reflector.getDecorators(maybeProvider, isModDecor);
  return (maybeProvider instanceof Class && !isSomeModule) || isNormalizedProvider(maybeProvider);
}
