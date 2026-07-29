import { DecoratorMeta } from '#di/top/decorator-and-value.js';
import type { AnyObj, RequireProps } from '#types/mix.js';
import type { DynamicModule } from '#decorators/module-decorator-options.js';
import { FeatureModuleOptions } from '#decorators/module-decorator-options.js';
import { ModuleMixin } from '#decorators/module-mixins.js';
import { NormalizedModuleMeta } from '#init/normalized-meta.js';
import { RootModuleOptions } from './root-module.js';

export function isDynamicModuleWrapper(arg?: AnyObj): arg is { dynamicModule: DynamicModule } {
  return isDynamicModule((arg as { dynamicModule: DynamicModule } | undefined)?.dynamicModule);
}

export function isRootModule(decorAndVal?: DecoratorMeta): decorAndVal is DecoratorMeta<RootModuleOptions>;
export function isRootModule(
  normalizedModuleMeta?: NormalizedModuleMeta,
): normalizedModuleMeta is NormalizedModuleMeta<RootModuleOptions>;
export function isRootModule(moduleOptions?: AnyObj): moduleOptions is RootModuleOptions;
export function isRootModule(
  arg?: DecoratorMeta | RootModuleOptions | NormalizedModuleMeta,
): arg is DecoratorMeta<RootModuleOptions> {
  if (arg instanceof DecoratorMeta) {
    if (arg.value instanceof ModuleMixin) {
      return arg.value.moduleRole === 'root';
    }
    return arg.value instanceof RootModuleOptions;
  } else if (arg instanceof NormalizedModuleMeta) {
    if (arg.staticModuleOptions instanceof ModuleMixin) {
      return arg.staticModuleOptions.moduleRole === 'root';
    }
    return arg.staticModuleOptions instanceof RootModuleOptions;
  } else if (arg instanceof ModuleMixin) {
    return arg.moduleRole === 'root';
  }
  return arg instanceof RootModuleOptions;
}

export function isFeatureModule(arg?: DecoratorMeta): arg is DecoratorMeta<FeatureModuleOptions>;
export function isFeatureModule(
  normalizedModuleMeta?: NormalizedModuleMeta,
): normalizedModuleMeta is NormalizedModuleMeta<FeatureModuleOptions>;
export function isFeatureModule(arg?: AnyObj): arg is FeatureModuleOptions;
export function isFeatureModule(
  arg?: DecoratorMeta | FeatureModuleOptions | NormalizedModuleMeta,
): arg is DecoratorMeta<FeatureModuleOptions> {
  if (arg instanceof DecoratorMeta) {
    if (arg.value instanceof ModuleMixin) {
      return arg.value.moduleRole === 'feature';
    }
    return arg.value instanceof FeatureModuleOptions;
  } else if (arg instanceof NormalizedModuleMeta) {
    if (arg.staticModuleOptions instanceof ModuleMixin) {
      return arg.staticModuleOptions.moduleRole === 'feature';
    }
    return arg.staticModuleOptions instanceof FeatureModuleOptions;
  } else if (arg instanceof ModuleMixin) {
    return arg.moduleRole === 'feature';
  }
  return arg instanceof FeatureModuleOptions;
}

export function isModuleDecorator(
  arg?: DecoratorMeta,
): arg is DecoratorMeta<RootModuleOptions | FeatureModuleOptions>;
export function isModuleDecorator(
  arg?: RootModuleOptions,
): arg is RootModuleOptions | FeatureModuleOptions;
export function isModuleDecorator(arg?: any) {
  return isRootModule(arg) || isFeatureModule(arg);
}

export function isModuleWithModuleMixin(metadata?: ModuleMixin<AnyObj>): metadata is ModuleMixin<AnyObj>;
export function isModuleWithModuleMixin(arg?: DecoratorMeta): arg is Required<DecoratorMeta<ModuleMixin<AnyObj>>>;
export function isModuleWithModuleMixin(
  arg?: DecoratorMeta | ModuleMixin<AnyObj>,
): arg is DecoratorMeta<ModuleMixin<AnyObj>> {
  if (arg instanceof DecoratorMeta) {
    return (arg as DecoratorMeta<ModuleMixin<AnyObj>>).value instanceof ModuleMixin;
  } else {
    return arg instanceof ModuleMixin;
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
