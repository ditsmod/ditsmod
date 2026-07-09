import { DecoratorAndValue } from '#di/top/decorator-and-value.js';
import type { AnyObj, RequireProps } from '#types/mix.js';
import type { ModuleWithParams } from '#decorators/module-decorator-options.js';
import { ModuleDecoratorOptions } from '#decorators/module-decorator-options.js';
import { InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { NormalizedModuleMeta } from '#init/base-meta.js';
import { RootDecoratorOptions } from './root-module.js';

export function isParamsWithMwp(arg?: AnyObj): arg is { mwp: ModuleWithParams } {
  return isModuleWithParams((arg as { mwp: ModuleWithParams } | undefined)?.mwp);
}

export function isRootModule(decorAndVal?: DecoratorAndValue): decorAndVal is DecoratorAndValue<RootDecoratorOptions>;
export function isRootModule(normalizedModuleMeta?: NormalizedModuleMeta): normalizedModuleMeta is NormalizedModuleMeta<RootDecoratorOptions>;
export function isRootModule(decoratorOptions?: AnyObj): decoratorOptions is RootDecoratorOptions;
export function isRootModule(
  arg?: DecoratorAndValue | RootDecoratorOptions | NormalizedModuleMeta,
): arg is DecoratorAndValue<RootDecoratorOptions> {
  if (arg instanceof DecoratorAndValue) {
    if (arg.value instanceof InitHooks) {
      return arg.value.moduleRole === 'root';
    }
    return arg.value instanceof RootDecoratorOptions;
  } else if (arg instanceof NormalizedModuleMeta) {
    if (arg.decoratorOptions instanceof InitHooks) {
      return arg.decoratorOptions.moduleRole === 'root';
    }
    return arg.decoratorOptions instanceof RootDecoratorOptions;
  } else if (arg instanceof InitHooks) {
    return arg.moduleRole === 'root';
  }
  return arg instanceof RootDecoratorOptions;
}

export function isFeatureModule(arg?: DecoratorAndValue): arg is DecoratorAndValue<ModuleDecoratorOptions>;
export function isFeatureModule(normalizedModuleMeta?: NormalizedModuleMeta): normalizedModuleMeta is NormalizedModuleMeta<ModuleDecoratorOptions>;
export function isFeatureModule(arg?: AnyObj): arg is ModuleDecoratorOptions;
export function isFeatureModule(
  arg?: DecoratorAndValue | ModuleDecoratorOptions | NormalizedModuleMeta,
): arg is DecoratorAndValue<ModuleDecoratorOptions> {
  if (arg instanceof DecoratorAndValue) {
    if (arg.value instanceof InitHooks) {
      return arg.value.moduleRole === 'feature';
    }
    return arg.value instanceof ModuleDecoratorOptions;
  } else if (arg instanceof NormalizedModuleMeta) {
    if (arg.decoratorOptions instanceof InitHooks) {
      return arg.decoratorOptions.moduleRole === 'feature';
    }
    return arg.decoratorOptions instanceof ModuleDecoratorOptions;
  } else if (arg instanceof InitHooks) {
    return arg.moduleRole === 'feature';
  }
  return arg instanceof ModuleDecoratorOptions;
}

export function isModDecor(
  arg?: DecoratorAndValue,
): arg is DecoratorAndValue<RootDecoratorOptions | ModuleDecoratorOptions>;
export function isModDecor(arg?: RootDecoratorOptions): arg is RootDecoratorOptions | ModuleDecoratorOptions;
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
