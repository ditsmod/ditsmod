import type { BaseExtensionConfig } from '#extension/extension-providers-and-configs.js';
import type { ModuleManager } from './module-manager.js';
import type { AnyObj, Level, PickProps } from '#types/mix.js';
import type { ProvidersByLevel } from '#types/providers-metadata.js';
import type { ModRefId, StaticModule } from '#decorators/module-decorator-options.js';
import type { AnyFn, Provider, Class } from '#di/top/types-and-models.js';
import type { DynamicModule, FeatureModuleOptions } from '#decorators/module-decorator-options.js';
import type { ForwardRefFn } from '#di/forward-ref.js';
import type { ExtensionClass } from '#extension/extension-types.js';
import type { AllModuleMixins, MixinOptions, ModuleMixin } from '#decorators/module-mixins.js';
import type { ProviderBuilder } from '#utils/providers.js';
import { normalizeExtensionConfig } from '#extension/extension-providers-and-configs.js';
import { getDebugClassName } from '#utils/get-debug-class-name.js';
import { NormalizedModuleMeta } from '#init/normalized-meta.js';
import { resolveForwardRef } from '#di/forward-ref.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { normalizeProviders, stringify } from '#utils/ng-utils.js';
import { isExtensionConfig } from '#extension/type-guards.js';
import { objectKeys } from '#utils/object-keys.js';
import { Reflector } from '#di/reflector.js';
import {
  isClassProvider,
  isMultiProvider,
  isNormalizedProvider,
  isTokenProvider,
  isValueProvider,
  type MultiProvider,
} from '#di/utils.js';
import {
  isDynamicModule,
  isRootModule,
  isModuleDecorator,
  isFeatureModule,
  isModuleWithModuleMixin,
  isDynamicModuleWrapper,
} from '#decorators/type-guards.js';
import {
  UndefinedSymbol,
  ResolvedCollisionTokensOnly,
  MissingModuleDecorator,
  InvalidModRefId,
  ReexportFailure,
  InvalidExtension,
  UnknownExport,
  ForbiddenNormalizedExport,
  ForbiddenAppExport,
  EmptyModuleMeta,
} from '#errors';
import type { RootModuleOptions } from '#decorators/root-module.js';
import type { DecoratorMeta } from '#di/top/decorator-and-value.js';
import type { SystemLogMediator } from '#logger/system-log-mediator.js';

/**
 * Normalizes and validates module metadata.
 */
export class ModuleNormalizer {
  protected normalizedModuleMeta: NormalizedModuleMeta;
  /**
   * The directory in which the class was declared.
   */
  protected rootDeclaredInDir: string;
  protected systemLogMediator: SystemLogMediator;

  /**
   * Returns normalized module metadata.
   */
  normalize(modRefId: ModRefId, allModuleMixin: AllModuleMixins, systemLogMediator: SystemLogMediator) {
    this.systemLogMediator = systemLogMediator;
    const normalizedModuleMeta = this.initNormalizedModuleMeta(modRefId);
    const { staticModuleOptions } = normalizedModuleMeta;
    this.checkAndMarkExternalModule(staticModuleOptions);

    // Phase 1: Normalize base decorator metadata.
    this.normalizeProvidersAndResolvedCollisions(staticModuleOptions);
    this.normalizeImports(staticModuleOptions);
    this.normalizeExtensions(staticModuleOptions);

    if (isDynamicModule(modRefId)) {
      this.normalizeDynamicModule(modRefId);
    }

    this.normalizeExports(staticModuleOptions, 'Static exports');
    if (isDynamicModule(modRefId)) {
      this.normalizeExports(modRefId, 'Dynamic exports');
    }

    this.checkReexportModules();

    // Phase 2: Process mixin decorators applied directly to the current module.
    this.addModuleMixinForHostMixin(allModuleMixin);
    this.callModuleMixinFromCurrentModule();

    // Phase 3: Handle module mixins for imported dynamic modules lacking their own mixin decorators.
    this.addModuleMixinForImportedDynamicModule(allModuleMixin);

    this.quickCheckMeta(staticModuleOptions);
    return normalizedModuleMeta;
  }

  protected initNormalizedModuleMeta(modRefId: ModRefId) {
    const decoratorsMeta = this.getDecoratorMeta(modRefId) || [];
    const decoratorMeta = decoratorsMeta.find((d) => isModuleDecorator(d));
    const staticModuleOptions = decoratorMeta?.value;
    const moduleName = getDebugClassName(modRefId);
    if (!moduleName) {
      throw new InvalidModRefId();
    }
    if (!staticModuleOptions) {
      throw new MissingModuleDecorator(moduleName);
    }

    /**
     * Setting initial properties of metadata.
     */
    const normalizedModuleMeta = new NormalizedModuleMeta();
    this.normalizedModuleMeta = normalizedModuleMeta;
    normalizedModuleMeta.name = moduleName;
    normalizedModuleMeta.staticModuleOptions = staticModuleOptions;
    normalizedModuleMeta.declaredInDir = decoratorMeta?.declaredInDir || '.';
    normalizedModuleMeta.modRefId = modRefId;
    decoratorsMeta.filter(isModuleWithModuleMixin).forEach(({ decoratorId, value }) => {
      normalizedModuleMeta.moduleMixinMap.set(decoratorId, value);
    });
    return normalizedModuleMeta;
  }

  protected getDecoratorMeta(modRefId: ModRefId): DecoratorMeta[] | undefined {
    modRefId = resolveForwardRef(modRefId);
    const staticModule = isDynamicModule(modRefId) ? resolveForwardRef(modRefId.module) : modRefId;
    return Reflector.getClassLevelMeta(staticModule);
  }

  /**
   * Since this method relies on the established variable {@link rootDeclaredInDir},
   * during scanning the {@link ModuleManager} must first scan the root module.
   */
  protected checkAndMarkExternalModule(staticModuleOptions: RootModuleOptions) {
    if (this.rootDeclaredInDir) {
      const { declaredInDir } = this.normalizedModuleMeta;
      if (declaredInDir !== '.') {
        // Case when CallsiteUtils.getCallerDir() works correctly.
        this.normalizedModuleMeta.isExternal =
          !declaredInDir.startsWith(this.rootDeclaredInDir) ||
          (!this.rootDeclaredInDir.includes('ditsmod/packages') && declaredInDir.includes('ditsmod/packages'));
      }
    } else if (isRootModule(staticModuleOptions) && this.normalizedModuleMeta.declaredInDir !== '.') {
      this.rootDeclaredInDir = this.normalizedModuleMeta.declaredInDir;
      this.normalizedModuleMeta.isExternal = false;
    }

    if (this.normalizedModuleMeta.isExternal === undefined) {
      this.systemLogMediator.externalModuleDetectionFailed(this);
    }

    if (staticModuleOptions.inheritsContext !== undefined) {
      this.normalizedModuleMeta.inheritsContext = staticModuleOptions.inheritsContext;
    }
  }

  protected normalizeProvidersAndResolvedCollisions(
    staticModuleOptions: MixinOptions & PickProps<RootModuleOptions, 'resolvedCollisionsPerApp'>,
  ) {
    this.normalizeProviders(staticModuleOptions);
    this.normalizeResolvedCollisions(staticModuleOptions);
  }

  protected normalizeProviders(moduleOptions: Partial<ProvidersByLevel>) {
    (['App', 'Mod', 'Rou', 'Req'] as const).forEach((level) => {
      const providersKey = `providersPer${level}` as const;
      if (moduleOptions[providersKey]) {
        const providersPerLevel = this.resolveAllForwardRefs(moduleOptions[providersKey]);
        this.normalizedModuleMeta[providersKey].push(...providersPerLevel);
      }
    });
  }

  protected normalizeResolvedCollisions(staticModuleOptions: MixinOptions & PickProps<RootModuleOptions, 'resolvedCollisionsPerApp'>) {
    (['App', 'Mod', 'Rou', 'Req'] as const).forEach((level) => {
      const resolvedCollisionKey = `resolvedCollisionsPer${level}` as const;
      if (staticModuleOptions[resolvedCollisionKey]) {
        staticModuleOptions[resolvedCollisionKey].forEach(([token, module]) => {
          token = resolveForwardRef(token);
          module = resolveForwardRef(module);
          if (isDynamicModule(module)) {
            module.module = resolveForwardRef(module.module);
          }
          this.normalizedModuleMeta[resolvedCollisionKey].push([token, module]);
        });
      }
    });
  }

  protected normalizeExports(moduleOptions: { exports?: any[] }, action: 'Static exports' | 'Dynamic exports') {
    if (!moduleOptions.exports) {
      return;
    }
    const tokensAtAllLevels = getTokens(
      this.normalizedModuleMeta.providersPerApp.concat(
        this.normalizedModuleMeta.providersPerMod,
        this.normalizedModuleMeta.providersPerRou,
        this.normalizedModuleMeta.providersPerReq,
      ),
    );

    this.resolveAllForwardRefs(moduleOptions.exports).forEach((exp, i) => {
      if (exp === undefined) {
        throw new UndefinedSymbol(action, this.normalizedModuleMeta.name, i);
      }
      if (isNormalizedProvider(exp)) {
        throw new ForbiddenNormalizedExport(this.normalizedModuleMeta.name, exp.token.name || exp.token);
      }
      if (isDynamicModule(exp)) {
        if (!this.normalizedModuleMeta.exportedDynamicModules.includes(exp)) {
          this.normalizedModuleMeta.exportedDynamicModules.push(exp);
        }
      } else if (tokensAtAllLevels.includes(exp)) {
        this.exportProviders(exp);
      } else if (this.getDecoratorMeta(exp)?.some(isModuleDecorator)) {
        if (!this.normalizedModuleMeta.exportedStaticModules.includes(exp)) {
          this.normalizedModuleMeta.exportedStaticModules.push(exp);
        }
      } else {
        throw new UnknownExport(this.normalizedModuleMeta.name, stringify(exp));
      }
    });
  }

  protected exportProviders(token: any): void {
    let found = false;
    (['Mod', 'Rou', 'Req'] satisfies Level[]).forEach((level) => {
      const providers = this.normalizedModuleMeta[`providersPer${level}`].filter((p) => getToken(p) === token);
      if (providers.length) {
        found = true;
        if (providers.some(isMultiProvider)) {
          this.normalizedModuleMeta[`exportedMultiProvidersPer${level}`].push(...(providers as MultiProvider[]));
        } else {
          this.normalizedModuleMeta[`exportedProvidersPer${level}`].push(...providers);
        }
      }
    });

    if (!found) {
      const providerName = token.name || token;
      if (this.normalizedModuleMeta.providersPerApp.some((p) => getToken(p) === token)) {
        throw new ForbiddenAppExport(this.normalizedModuleMeta.name, providerName);
      } else {
        throw new UnknownExport(this.normalizedModuleMeta.name, providerName);
      }
    }
  }

  protected normalizeDynamicModule(dynamicModule: DynamicModule) {
    if (dynamicModule.id) {
      this.normalizedModuleMeta.id = dynamicModule.id;
    }
    this.normalizeProviders(dynamicModule);
    if (dynamicModule.extensionsMeta) {
      this.normalizedModuleMeta.extensionsMeta = {
        ...this.normalizedModuleMeta.extensionsMeta,
        ...dynamicModule.extensionsMeta,
      };
    }
  }

  protected normalizeImports(staticModuleOptions: RootModuleOptions) {
    this.resolveAllForwardRefs(staticModuleOptions.imports).forEach((imp, i) => {
      if (imp === undefined) {
        throw new UndefinedSymbol('Imports', this.normalizedModuleMeta.name, i);
      }
      if (isDynamicModule(imp)) {
        this.normalizedModuleMeta.importedDynamicModules.push(imp);
      } else {
        this.normalizedModuleMeta.importedStaticModules.push(imp);
      }
    });
  }

  protected throwIfResolvingNormalizedProvider(
    staticModuleOptions: MixinOptions & PickProps<RootModuleOptions, 'resolvedCollisionsPerApp'>,
  ) {
    const resolvedCollisionsPerLevel: [any, ModRefId | ForwardRefFn<StaticModule | DynamicModule>][] = [];
    (['App', 'Mod', 'Rou', 'Req'] as const).forEach((level) => {
      if (Array.isArray(staticModuleOptions[`resolvedCollisionsPer${level}`])) {
        resolvedCollisionsPerLevel.push(...staticModuleOptions[`resolvedCollisionsPer${level}`]!);
      }
    });

    resolvedCollisionsPerLevel.forEach(([provider]) => {
      provider = resolveForwardRef(provider);
      if (isNormalizedProvider(provider)) {
        const providerName = provider.token.name || provider.token;
        throw new ResolvedCollisionTokensOnly(this.normalizedModuleMeta.name, providerName);
      }
    });
  }

  protected normalizeExtensions(staticModuleOptions: PickProps<FeatureModuleOptions, 'extensions' | 'extensionsMeta'>) {
    if (staticModuleOptions.extensionsMeta) {
      this.normalizedModuleMeta.extensionsMeta = {
        ...this.normalizedModuleMeta.extensionsMeta,
        ...staticModuleOptions.extensionsMeta,
      };
    }

    staticModuleOptions.extensions?.forEach((extensionClassOrConfig) => {
      if (!isExtensionConfig(extensionClassOrConfig)) {
        extensionClassOrConfig = { extension: extensionClassOrConfig } as BaseExtensionConfig;
      }
      const normalizedExtensionConfig = normalizeExtensionConfig(extensionClassOrConfig);
      normalizedExtensionConfig.providers.forEach((p) => this.checkStageMethodsForExtension(p));
      if (normalizedExtensionConfig.config) {
        this.normalizedModuleMeta.extensionConfigs.push(normalizedExtensionConfig.config);
      }
      if (normalizedExtensionConfig.exportedConfig) {
        this.normalizedModuleMeta.exportedExtensionConfigs.push(normalizedExtensionConfig.exportedConfig);
      }
      this.normalizedModuleMeta.extensionProviders.push(...normalizedExtensionConfig.providers);
      this.normalizedModuleMeta.exportedExtensionProviders.push(...normalizedExtensionConfig.exportedProviders);
      normalizedExtensionConfig.groupTokensMap?.forEach((groupToken, ExtensionCls) => {
        if (!this.normalizedModuleMeta.extensionGroupTokensMap.has(ExtensionCls)) {
          this.normalizedModuleMeta.extensionGroupTokensMap.set(ExtensionCls, groupToken);
          this.normalizedModuleMeta.extensionProviders.unshift({ token: groupToken, useToken: ExtensionCls, multi: true });
        }
      });
      normalizedExtensionConfig.exportedGroupTokensMap?.forEach((groupToken, ExtensionCls) => {
        if (!this.normalizedModuleMeta.exportedExtensionGroupTokensMap.has(ExtensionCls)) {
          this.normalizedModuleMeta.exportedExtensionGroupTokensMap.set(ExtensionCls, groupToken);
        }
      });
    });
  }

  protected checkStageMethodsForExtension(extensionsProvider: Provider) {
    const np = normalizeProviders([extensionsProvider])[0];
    let ExtensionCls: ExtensionClass | undefined;
    if (isClassProvider(np)) {
      ExtensionCls = resolveForwardRef(np.useClass);
    } else if (isTokenProvider(np) && np.useToken instanceof Function) {
      ExtensionCls = resolveForwardRef(np.useToken);
    } else if (isValueProvider(np) && np.useValue.constructor instanceof Function) {
      ExtensionCls = np.useValue.constructor;
    }

    if (
      !ExtensionCls ||
      (typeof ExtensionCls.prototype?.stage1 != 'function' &&
        typeof ExtensionCls.prototype?.stage2 != 'function' &&
        typeof ExtensionCls.prototype?.stage3 != 'function')
    ) {
      const token = getToken(extensionsProvider);
      throw new InvalidExtension(this.normalizedModuleMeta.name, token.name || token);
    }
  }

  protected checkReexportModules() {
    if (isRootModule(this.normalizedModuleMeta)) {
      // Allow exporting from the root module without importing.
      return;
    }
    const imports = [...this.normalizedModuleMeta.importedStaticModules, ...this.normalizedModuleMeta.importedDynamicModules];
    const exports = [...this.normalizedModuleMeta.exportedStaticModules, ...this.normalizedModuleMeta.exportedDynamicModules];

    exports.forEach((modRefId) => {
      if (!imports.includes(modRefId)) {
        throw new ReexportFailure(this.normalizedModuleMeta.name, getDebugClassName(modRefId) || '""');
      }
    });
  }

  /**
   * If {@link ModuleMixin} has {@link ModuleMixin.hostMixinOptions | hostMixinOptions}, this method
   * inserts an module mixin that can add `hostMixinOptions` to the host module.
   */
  protected addModuleMixinForHostMixin(allModuleMixin: AllModuleMixins) {
    allModuleMixin.forEach((moduleMixin, decorator) => {
      if (moduleMixin.hostModule === this.normalizedModuleMeta.modRefId && moduleMixin.hostMixinOptions) {
        const newModuleMixin = moduleMixin.clone(moduleMixin.hostMixinOptions);
        this.normalizedModuleMeta.moduleMixinMap.set(decorator, newModuleMixin);
      }
    });
  }

  /**
   * Ensures the host module (if any) is added to `importedStaticModules` for the current module,
   * unless the current module itself is the host module.
   */
  protected ensureHostModuleImported(moduleMixin: ModuleMixin): void {
    const { hostModule } = moduleMixin;
    if (
      hostModule &&
      hostModule !== this.normalizedModuleMeta.modRefId &&
      !this.normalizedModuleMeta.importedStaticModules.includes(hostModule)
    ) {
      this.normalizedModuleMeta.importedStaticModules.push(hostModule);
    }
  }

  /**
   * Registers an module mixin into `allModuleMixin`, ensures the host module is imported,
   * calls the module mixin, and backfills `moduleMixinMap` (needed for `quickCheckMeta`
   * and `callModuleMixinAfterScan`).
   */
  protected registerAndCallModuleMixin(decorator: AnyFn, moduleMixin: ModuleMixin): void {
    this.normalizedModuleMeta.allModuleMixin.set(decorator, moduleMixin);
    this.ensureHostModuleImported(moduleMixin);
    this.callModuleMixin(decorator, moduleMixin);
    this.normalizedModuleMeta.moduleMixinMap.set(decorator, moduleMixin);
  }

  protected callModuleMixinFromCurrentModule() {
    this.normalizedModuleMeta.moduleMixinMap.forEach((moduleMixin, decorator) => {
      this.normalizedModuleMeta.allModuleMixin.set(decorator, moduleMixin);
      this.ensureHostModuleImported(moduleMixin);
      this.fetchMixinOptions(decorator, moduleMixin.moduleOptions);
      this.callModuleMixin(decorator, moduleMixin);
    });
  }

  /**
   * If the current module was used as dynamic module in the context of mixin decorators, but
   * the class of the current module is not annotated with those decorators, then retrieve
   * the corresponding module mixins (for reading dynamic options) from the `allModuleMixin`.
   * 
   * ### Example
   * 
```ts
import { featureModule, rootModule } from '@ditsmod/core';
import { mixinRest } from '@ditsmod/rest';

@featureModule()
class Module1 {}

@mixinRest({ imports: [{ module: Module1, path: 'some-prefix' }] })
@rootModule()
export class AppModule {}
```
   * 
   * As you can see, `Module1` is imported in the context of the `mixinRest` decorator,
   * but `Module1` itself does not have an annotation with `mixinRest`. For such cases,
   * this method adds hooks so that the import of dynamic `Module1` can be properly handled.
   */
  protected addModuleMixinForImportedDynamicModule(allModuleMixin: AllModuleMixins) {
    (this.normalizedModuleMeta.modRefId as DynamicModule).mixinOptions?.forEach((params, decorator) => {
      if (!this.normalizedModuleMeta.moduleMixinMap.has(decorator)) {
        const newModuleMixin = allModuleMixin.get(decorator)!.clone();
        this.registerAndCallModuleMixin(decorator, newModuleMixin);
      }
    });
  }

  protected resolveAllForwardRefs<T extends ModRefId | Provider | ForwardRefFn | { dynamicModule: DynamicModule }>(
    arr: T[] | ProviderBuilder = [],
  ): Exclude<T, ForwardRefFn>[] {
    return [...arr].map((item) => {
      const resolved = resolveForwardRef(item);
      if (isDynamicModuleWrapper(resolved)) {
        resolved.dynamicModule.module = resolveForwardRef(resolved.dynamicModule.module);
      } else if (isNormalizedProvider(resolved)) {
        resolved.token = resolveForwardRef(resolved.token);
        if (isClassProvider(resolved)) {
          resolved.useClass = resolveForwardRef(resolved.useClass);
        } else if (isTokenProvider(resolved)) {
          resolved.useToken = resolveForwardRef(resolved.useToken);
        }
      } else if (isDynamicModule(resolved)) {
        resolved.module = resolveForwardRef(resolved.module);
      }
      return resolved;
    }) as Exclude<T, ForwardRefFn>[];
  }

  protected fetchMixinOptions(decorator: AnyFn, mixinDecoratorOptions: MixinOptions) {
    this.fetchMixinImports(decorator, mixinDecoratorOptions);
    this.fetchMixinExports(mixinDecoratorOptions);
    this.normalizeExtensions(mixinDecoratorOptions);
    this.normalizeProvidersAndResolvedCollisions(mixinDecoratorOptions);
    this.normalizeExports(mixinDecoratorOptions, 'Static exports');
  }

  protected fetchMixinImports(decorator: AnyFn, mixinDecoratorOptions: MixinOptions) {
    if (mixinDecoratorOptions.imports) {
      this.resolveAllForwardRefs(mixinDecoratorOptions.imports).forEach((imp) => {
        if (isDynamicModule(imp)) {
          const params = { ...imp };
          this.mergeMixinDynamicOptions(decorator, params, imp);
        } else if (isDynamicModuleWrapper(imp)) {
          const params = { ...imp } as { dynamicModule?: DynamicModule };
          this.mergeObjects(params, imp.dynamicModule);
          delete params.dynamicModule;
          this.mergeMixinDynamicOptions(decorator, params, imp.dynamicModule);
        } else {
          if (!this.normalizedModuleMeta.importedStaticModules.includes(imp)) {
            this.normalizedModuleMeta.importedStaticModules.push(imp);
          }
        }
      });
    }
  }

  protected mergeMixinDynamicOptions(decorator: AnyFn, params: AnyObj, dynamicModule: DynamicModule) {
    delete params.module;
    delete params.mixinOptions;
    dynamicModule.mixinOptions ??= new Map();
    if (dynamicModule.mixinOptions.has(decorator)) {
      const existingParams = dynamicModule.mixinOptions.get(decorator)!;
      dynamicModule.mixinOptions.set(decorator, this.mergeObjects(params, existingParams));
    } else {
      dynamicModule.mixinOptions.set(decorator, params);
    }
    if (!this.normalizedModuleMeta.importedDynamicModules.includes(dynamicModule)) {
      this.normalizedModuleMeta.importedDynamicModules.push(dynamicModule);
    }
  }

  protected mergeObjects(dstn: AnyObj, src: AnyObj) {
    objectKeys(src).forEach((prop) => {
      if (prop == 'mixinOptions' || prop == 'module') {
        // ignore
      } else if (Array.isArray(src[prop])) {
        if (src[prop].length) {
          dstn[prop] = [...src[prop], ...(dstn[prop] || [])];
        }
      } else if (src[prop] !== null && typeof src[prop] == 'object') {
        dstn[prop] ??= {};
        dstn[prop] = Object.assign(src[prop], dstn[prop]);
      } else {
        dstn[prop] ??= src[prop];
      }
    });

    return dstn;
  }

  protected fetchMixinExports(mixinDecoratorOptions: MixinOptions) {
    if (mixinDecoratorOptions.exports) {
      this.resolveAllForwardRefs(mixinDecoratorOptions.exports).forEach((exp) => {
        if (isDynamicModule(exp)) {
          if (!this.normalizedModuleMeta.exportedDynamicModules.includes(exp)) {
            this.normalizedModuleMeta.exportedDynamicModules.push(exp);
          }
        } else if (isDynamicModuleWrapper(exp)) {
          if (!this.normalizedModuleMeta.exportedDynamicModules.includes(exp.dynamicModule)) {
            this.normalizedModuleMeta.exportedDynamicModules.push(exp.dynamicModule);
          }
        } else if (Reflector.getClassLevelMeta(exp, isFeatureModule)) {
          if (!this.normalizedModuleMeta.exportedStaticModules.includes(exp)) {
            this.normalizedModuleMeta.exportedStaticModules.push(exp);
          }
        }
      });
    }
  }

  protected callModuleMixin(decorator: AnyFn, moduleMixin: ModuleMixin) {
    const meta = moduleMixin.normalize(this.normalizedModuleMeta);
    if (meta) {
      this.normalizedModuleMeta.mixinMeta.set(decorator, meta);
    }
  }

  protected quickCheckMeta(staticModuleOptions: RootModuleOptions) {
    this.throwIfResolvingNormalizedProvider(staticModuleOptions);
  }

  propagateParentHooks(normalizedModuleMeta: NormalizedModuleMeta, allModuleMixin: AllModuleMixins) {
    this.normalizedModuleMeta = normalizedModuleMeta;
    this.addModuleMixinFromParent(allModuleMixin);
  }

  protected addModuleMixinFromParent(allModuleMixin: AllModuleMixins) {
    const inheritsContext = this.normalizedModuleMeta.inheritsContext ?? !this.normalizedModuleMeta.isExternal;
    if (!inheritsContext || this.normalizedModuleMeta.moduleMixinMap.size > 0) {
      return;
    }
    allModuleMixin.forEach((moduleMixin, decorator) => {
      const newModuleMixin = moduleMixin.clone();
      this.registerAndCallModuleMixin(decorator, newModuleMixin);
    });
  }

  checkEmptyMeta(normalizedModuleMeta: NormalizedModuleMeta) {
    if (
      !isRootModule(normalizedModuleMeta) &&
      !normalizedModuleMeta.moduleMixinMap.size &&
      !normalizedModuleMeta.exportedProvidersPerMod.length &&
      !normalizedModuleMeta.exportedMultiProvidersPerMod.length &&
      !normalizedModuleMeta.exportedStaticModules.length &&
      !normalizedModuleMeta.providersPerApp.length &&
      !normalizedModuleMeta.exportedDynamicModules.length &&
      !normalizedModuleMeta.exportedExtensionProviders.length &&
      !normalizedModuleMeta.extensionProviders.length
    ) {
      throw new EmptyModuleMeta();
    }
  }
}
