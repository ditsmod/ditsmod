import { DecoratorAndValue } from '#di/top/decorator-and-value.js';
import type { AnyObj, RequireProps } from '#types/mix.js';
import type { ModuleWithParams } from '#decorators/module-raw-metadata.js';
import { ModuleRawMetadata } from '#decorators/module-raw-metadata.js';
import { InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { BaseMeta } from '#init/base-meta.js';
import { RootDecoratorOptions } from './root-module.js';

export function isParamsWithMwp(arg?: AnyObj): arg is { mwp: ModuleWithParams } {
  return isModuleWithParams((arg as { mwp: ModuleWithParams } | undefined)?.mwp);
}

export function isRootModule(decorAndVal?: DecoratorAndValue): decorAndVal is DecoratorAndValue<RootDecoratorOptions>;
export function isRootModule(baseMeta?: BaseMeta): baseMeta is BaseMeta<RootDecoratorOptions>;
export function isRootModule(rawMeta?: AnyObj): rawMeta is RootDecoratorOptions;
export function isRootModule(
  arg?: DecoratorAndValue | RootDecoratorOptions | BaseMeta,
): arg is DecoratorAndValue<RootDecoratorOptions> {
  if (arg instanceof DecoratorAndValue) {
    if (arg.value instanceof InitHooks) {
      return arg.value.moduleRole === 'root';
    }
    return arg.value instanceof RootDecoratorOptions;
  } else if (arg instanceof BaseMeta) {
    if (arg.rawMeta instanceof InitHooks) {
      return arg.rawMeta.moduleRole === 'root';
    }
    return arg.rawMeta instanceof RootDecoratorOptions;
  } else if (arg instanceof InitHooks) {
    return arg.moduleRole === 'root';
  }
  return arg instanceof RootDecoratorOptions;
}

export function isFeatureModule(arg?: DecoratorAndValue): arg is DecoratorAndValue<ModuleRawMetadata>;
export function isFeatureModule(baseMeta?: BaseMeta): baseMeta is BaseMeta<ModuleRawMetadata>;
export function isFeatureModule(arg?: AnyObj): arg is ModuleRawMetadata;
export function isFeatureModule(
  arg?: DecoratorAndValue | ModuleRawMetadata | BaseMeta,
): arg is DecoratorAndValue<ModuleRawMetadata> {
  if (arg instanceof DecoratorAndValue) {
    if (arg.value instanceof InitHooks) {
      return arg.value.moduleRole === 'feature';
    }
    return arg.value instanceof ModuleRawMetadata;
  } else if (arg instanceof BaseMeta) {
    if (arg.rawMeta instanceof InitHooks) {
      return arg.rawMeta.moduleRole === 'feature';
    }
    return arg.rawMeta instanceof ModuleRawMetadata;
  } else if (arg instanceof InitHooks) {
    return arg.moduleRole === 'feature';
  }
  return arg instanceof ModuleRawMetadata;
}

export function isModDecor(arg?: DecoratorAndValue): arg is DecoratorAndValue<RootDecoratorOptions | ModuleRawMetadata>;
export function isModDecor(arg?: RootDecoratorOptions): arg is RootDecoratorOptions | ModuleRawMetadata;
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
