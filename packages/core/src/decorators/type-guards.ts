import { DecoratorMeta } from '#di/top/decorator-and-value.js';
import type { AnyObj, RequireProps } from '#types/mix.js';
import type { DynamicModule } from '#decorators/module-decorator-options.js';
import { ModuleDecoratorOptions } from '#decorators/module-decorator-options.js';
import { InitHooks } from '#decorators/init-hooks-and-metadata.js';
import { NormalizedModuleMeta } from '#init/base-meta.js';
import { RootDecoratorOptions } from './root-module.js';

export function isDynamicModuleWrapper(arg?: AnyObj): arg is { dynamicModule: DynamicModule } {
  return isDynamicModule((arg as { dynamicModule: DynamicModule } | undefined)?.dynamicModule);
}

export function isRootModule(decorAndVal?: DecoratorMeta): decorAndVal is DecoratorMeta<RootDecoratorOptions>;
export function isRootModule(
  normalizedModuleMeta?: NormalizedModuleMeta,
): normalizedModuleMeta is NormalizedModuleMeta<RootDecoratorOptions>;
export function isRootModule(decoratorOptions?: AnyObj): decoratorOptions is RootDecoratorOptions;
export function isRootModule(
  arg?: DecoratorMeta | RootDecoratorOptions | NormalizedModuleMeta,
): arg is DecoratorMeta<RootDecoratorOptions> {
  if (arg instanceof DecoratorMeta) {
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

export function isFeatureModule(arg?: DecoratorMeta): arg is DecoratorMeta<ModuleDecoratorOptions>;
export function isFeatureModule(
  normalizedModuleMeta?: NormalizedModuleMeta,
): normalizedModuleMeta is NormalizedModuleMeta<ModuleDecoratorOptions>;
export function isFeatureModule(arg?: AnyObj): arg is ModuleDecoratorOptions;
export function isFeatureModule(
  arg?: DecoratorMeta | ModuleDecoratorOptions | NormalizedModuleMeta,
): arg is DecoratorMeta<ModuleDecoratorOptions> {
  if (arg instanceof DecoratorMeta) {
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

export function isModuleDecorator(
  arg?: DecoratorMeta,
): arg is DecoratorMeta<RootDecoratorOptions | ModuleDecoratorOptions>;
export function isModuleDecorator(arg?: RootDecoratorOptions): arg is RootDecoratorOptions | ModuleDecoratorOptions;
export function isModuleDecorator(arg?: any) {
  return isRootModule(arg) || isFeatureModule(arg);
}

export function isModuleWithInitHooks(metadata?: InitHooks<AnyObj>): metadata is InitHooks<AnyObj>;
export function isModuleWithInitHooks(arg?: DecoratorMeta): arg is DecoratorMeta<InitHooks<AnyObj>>;
export function isModuleWithInitHooks(
  arg?: DecoratorMeta | InitHooks<AnyObj>,
): arg is DecoratorMeta<InitHooks<AnyObj>> {
  if (arg instanceof DecoratorMeta) {
    return (arg as DecoratorMeta<InitHooks<AnyObj>>).value instanceof InitHooks;
  } else {
    return arg instanceof InitHooks;
  }
}

/**
 * If this guard returns `true`, then the `DecoratorMeta`
 * instance passed to it has the `declaredInDir` property set.
 */
export function hasDeclaredInDir(
  decoratorMeta?: DecoratorMeta,
): decoratorMeta is RequireProps<DecoratorMeta, 'declaredInDir'> {
  return Boolean(decoratorMeta?.declaredInDir) && decoratorMeta?.declaredInDir != '.';
}

export function isDynamicModule(modRefId?: AnyObj): modRefId is DynamicModule {
  return (modRefId as DynamicModule)?.module !== undefined;
}
