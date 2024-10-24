import { format } from 'util';

import { Class, injectable, reflector, resolveForwardRef } from '#di';
import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { AnyObj, GuardItem, ModuleType, NormalizedGuard, Scope, Provider } from '#types/mix.js';
import { ModuleWithParams, AppendsWithParams, ModuleMetadata } from '#types/module-metadata.js';
import { ExtensionProvider, Extension } from '#types/extension-types.js';
import { NormalizedModuleMetadata } from '#types/normalized-module-metadata.js';
import {
  ExtensionOptions,
  getExtensionProvider,
  isOptionWithOverrideExtension,
} from '#utils/get-extension-provider.js';
import { ModuleMetadataWithContext, getModuleMetadata } from '#utils/get-module-metadata.js';
import { getModuleName } from '#utils/get-module-name.js';
import { getModule } from '#utils/get-module.js';
import { getToken, getTokens } from '#utils/get-tokens.js';
import { normalizeProviders } from '#utils/ng-utils.js';
import {
  MultiProvider,
  isAppendsWithParams,
  isClassProvider,
  isController,
  isModuleWithParams,
  isMultiProvider,
  isNormRootModule,
  isNormalizedProvider,
  isProvider,
  isRawRootModule,
  isTokenProvider,
  isValueProvider,
} from '#utils/type-guards.js';
import { Providers } from '#utils/providers.js';

export type ModulesMap = Map<ModuleType | ModuleWithParams, NormalizedModuleMetadata>;
export type ModulesMapId = Map<string, ModuleType | ModuleWithParams>;
/**
 * Don't use this for public API (worse readable).
 */
type AnyModule = ModuleType | ModuleWithParams | AppendsWithParams;
type ModuleId = string | ModuleType | ModuleWithParams;

/**
 * Scans modules, normalizes, stores and checks their metadata for correctness,
 * adds and removes imports of one module into another.
 */
@injectable()
export class ModuleManager {
  protected map: ModulesMap = new Map();
  protected mapId = new Map<string, AnyModule>();
  protected oldMap: ModulesMap = new Map();
  protected oldMapId = new Map<string, AnyModule>();
  protected unfinishedScanModules = new Set<AnyModule>();
  protected scanedModules = new Set<AnyModule>();
  /**
   * The directory in which the class was declared.
   */
  protected rootDeclaredInDir: string;

  constructor(protected systemLogMediator: SystemLogMediator) {}

  /**
   * Creates a snapshot of `NormalizedModuleMetadata` for the root module, stores locally and returns it.
   * You can also get the result this way: `moduleManager.getMetadata('root')`.
   */
  scanRootModule(appModule: ModuleType) {
    if (!getModuleMetadata(appModule, true)) {
      throw new Error(`Module scaning failed: "${appModule.name}" does not have the "@rootModule()" decorator`);
    }

    const meta = this.scanRawModule(appModule);
    this.scanedModules.clear();
    this.mapId.set('root', appModule);
    return this.copyMeta(meta);
  }

  /**
   * Returns a snapshot of `NormalizedModuleMetadata` for a module.
   */
  scanModule(modOrObj: ModuleType | ModuleWithParams) {
    const meta = this.scanRawModule(modOrObj);
    return this.copyMeta(meta);
  }

  /**
   * Returns a snapshot of `NormalizedModuleMetadata` for given module or module ID.
   */
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: false,
  ): NormalizedModuleMetadata<T, A> | undefined;
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound: true,
  ): NormalizedModuleMetadata<T, A>;
  getMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(moduleId: ModuleId, throwErrIfNotFound?: boolean) {
    const meta = this.getRawMetadata<T, A>(moduleId, throwErrIfNotFound);
    if (meta) {
      return this.copyMeta(meta);
    } else {
      return;
    }
  }

  /**
   * If `inputModule` added, returns `true`, otherwise - returns `false`.
   *
   * @param inputModule Module to be added.
   * @param targetModuleId Module ID to which the input module will be added.
   */
  addImport(inputModule: ModuleType | ModuleWithParams, targetModuleId: ModuleId = 'root'): boolean | void {
    const targetMeta = this.getRawMetadata(targetModuleId);
    if (!targetMeta) {
      const modName = getModuleName(inputModule);
      const modIdStr = format(targetModuleId);
      const msg = `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }

    const prop = isModuleWithParams(inputModule) ? 'importsWithParams' : 'importsModules';
    if (targetMeta[prop].some((imp: AnyModule) => imp === inputModule)) {
      const modIdStr = format(targetModuleId);
      this.systemLogMediator.moduleAlreadyImported(this, inputModule, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      (targetMeta[prop] as AnyModule[]).push(inputModule);
      this.scanRawModule(inputModule);
      this.systemLogMediator.successfulAddedModuleToImport(this, inputModule, targetMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
  }

  /**
   * @param targetModuleId Module ID from where the input module will be removed.
   */
  removeImport(inputModuleId: ModuleId, targetModuleId: ModuleId = 'root'): boolean | void {
    const inputMeta = this.getRawMetadata(inputModuleId);
    if (!inputMeta) {
      const modIdStr = format(inputModuleId);
      this.systemLogMediator.moduleNotFound(this, modIdStr);
      return false;
    }

    const targetMeta = this.getRawMetadata(targetModuleId);
    if (!targetMeta) {
      const modIdStr = format(targetModuleId);
      const msg = `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`;
      throw new Error(msg);
    }
    const prop = isModuleWithParams(inputMeta.module) ? 'importsWithParams' : 'importsModules';
    const index = targetMeta[prop].findIndex((imp: AnyModule) => imp === inputMeta.module);
    if (index == -1) {
      const modIdStr = format(inputModuleId);
      this.systemLogMediator.moduleNotFound(this, modIdStr);
      return false;
    }

    this.startTransaction();
    try {
      targetMeta[prop].splice(index, 1);
      if (!this.includesInSomeModule(inputModuleId, 'root')) {
        if (inputMeta.id) {
          this.mapId.delete(inputMeta.id);
        }
        this.map.delete(inputMeta.module);
      }
      this.systemLogMediator.moduleSuccessfulRemoved(this, inputMeta.name, targetMeta.name);
      return true;
    } catch (err) {
      this.rollback(err as Error);
    }
  }

  commit() {
    this.oldMapId = new Map();
    this.oldMap = new Map();
  }

  rollback(err?: Error) {
    if (!this.oldMapId.size) {
      throw new Error('It is forbidden for rollback() to an empty state.');
    }
    this.mapId = this.oldMapId;
    this.map = this.oldMap;
    this.commit();
    if (err) {
      throw err;
    }
  }

  /**
   * Returns shapshot of current map for all modules.
   */
  getModulesMap() {
    return new Map(this.map);
  }

  /**
   * Here "raw" means that it returns "raw" normalized metadata (without `this.copyMeta()`).
   */
  protected scanRawModule(modOrObj: AnyModule) {
    const meta = this.normalizeMetadata(modOrObj);

    const inputs = [
      ...meta.importsModules,
      ...meta.importsWithParams,
      ...meta.exportsModules,
      ...meta.exportsWithParams,
      ...meta.appendsWithParams,
    ];

    for (const input of inputs) {
      if (this.unfinishedScanModules.has(input) || this.scanedModules.has(input)) {
        continue;
      }
      this.unfinishedScanModules.add(input);
      this.scanRawModule(input);
      this.unfinishedScanModules.delete(input);
      this.scanedModules.add(input);
    }

    if (meta.id) {
      this.mapId.set(meta.id, modOrObj);
      this.systemLogMediator.moduleHasId(this, meta.id);
    }
    this.map.set(modOrObj, meta);
    return meta;
  }

  protected copyMeta<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(meta: NormalizedModuleMetadata<T, A>) {
    meta = { ...(meta || ({} as NormalizedModuleMetadata<T, A>)) };
    meta.importsModules = meta.importsModules.slice();
    meta.importsWithParams = meta.importsWithParams.slice();
    meta.appendsWithParams = meta.appendsWithParams.slice();
    meta.controllers = meta.controllers.slice();
    meta.extensionsProviders = meta.extensionsProviders.slice();
    meta.exportsModules = meta.exportsModules.slice();
    meta.exportsWithParams = meta.exportsWithParams.slice();
    meta.exportedProvidersPerMod = meta.exportedProvidersPerMod.slice();
    meta.exportedProvidersPerRou = meta.exportedProvidersPerRou.slice();
    meta.exportedProvidersPerReq = meta.exportedProvidersPerReq.slice();
    meta.exportedMultiProvidersPerMod = meta.exportedMultiProvidersPerMod.slice();
    meta.exportedMultiProvidersPerRou = meta.exportedMultiProvidersPerRou.slice();
    meta.exportedMultiProvidersPerReq = meta.exportedMultiProvidersPerReq.slice();
    meta.providersPerApp = meta.providersPerApp.slice();
    meta.providersPerMod = meta.providersPerMod.slice();
    meta.providersPerRou = meta.providersPerRou.slice();
    meta.providersPerReq = meta.providersPerReq.slice();
    meta.resolvedCollisionsPerApp = meta.resolvedCollisionsPerApp.slice();
    meta.resolvedCollisionsPerMod = meta.resolvedCollisionsPerMod.slice();
    meta.resolvedCollisionsPerRou = meta.resolvedCollisionsPerRou.slice();
    meta.resolvedCollisionsPerReq = meta.resolvedCollisionsPerReq.slice();
    meta.guardsPerMod = meta.guardsPerMod.slice();
    return meta;
  }

  /**
   * Returns normalized metadata, but without `this.copyMeta()`.
   */
  protected getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: boolean,
  ): NormalizedModuleMetadata<T, A> | undefined;
  protected getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound: true,
  ): NormalizedModuleMetadata<T, A>;
  protected getRawMetadata<T extends AnyObj = AnyObj, A extends AnyObj = AnyObj>(
    moduleId: ModuleId,
    throwErrIfNotFound?: boolean,
  ) {
    let meta: NormalizedModuleMetadata<T, A> | undefined;
    if (typeof moduleId == 'string') {
      const mapId = this.mapId.get(moduleId);
      if (mapId) {
        meta = this.map.get(mapId) as NormalizedModuleMetadata<T, A>;
      }
    } else {
      meta = this.map.get(moduleId) as NormalizedModuleMetadata<T, A>;
    }

    if (throwErrIfNotFound && !meta) {
      let moduleName: string;
      if (typeof moduleId == 'string') {
        moduleName = moduleId;
      } else {
        moduleName = getModuleName(moduleId);
      }
      throw new Error(`${moduleName} not found in ModuleManager.`);
    }

    return meta;
  }

  protected startTransaction() {
    if (this.oldMapId.has('root')) {
      // Transaction already started.
      return false;
    }

    this.map.forEach((meta, key) => {
      const oldMeta = { ...meta };
      oldMeta.importsModules = oldMeta.importsModules.slice();
      oldMeta.importsWithParams = oldMeta.importsWithParams.slice();
      oldMeta.appendsWithParams = oldMeta.appendsWithParams.slice();
      oldMeta.exportsModules = oldMeta.exportsModules.slice();
      oldMeta.exportsWithParams = oldMeta.exportsWithParams.slice();
      this.oldMap.set(key, oldMeta);
    });
    this.oldMapId = new Map(this.mapId);

    return true;
  }

  /**
   * Recursively searches for input module.
   * Returns true if input module includes in imports/exports of target module.
   *
   * @param inputModuleId The module you need to find.
   * @param targetModuleId Module where to search `inputModule`.
   */
  protected includesInSomeModule(inputModuleId: ModuleId, targetModuleId: ModuleId): boolean {
    const targetMeta = this.getRawMetadata(targetModuleId);
    const importsOrExports: (ModuleType<AnyObj> | ModuleWithParams<AnyObj>)[] = [];

    if (targetMeta) {
      importsOrExports.push(
        ...targetMeta.importsModules,
        ...targetMeta.importsWithParams,
        ...targetMeta.appendsWithParams,
        ...targetMeta.exportsModules,
        ...targetMeta.exportsWithParams,
      );
    }

    return (
      importsOrExports.some((modOrObj) => {
        return inputModuleId === modOrObj;
      }) ||
      importsOrExports.some((modOrObj) => {
        return this.includesInSomeModule(inputModuleId, modOrObj);
      })
    );
  }

  /**
   * Returns normalized module metadata.
   */
  protected normalizeMetadata(mod: AnyModule) {
    const rawMeta = getModuleMetadata(mod);
    const modName = getModuleName(mod);
    if (!rawMeta) {
      throw new Error(`Module build failed: module "${modName}" does not have the "@featureModule()" decorator`);
    }

    /**
     * Setting initial properties of metadata.
     */
    const meta = new NormalizedModuleMetadata();
    meta.name = modName;
    meta.module = mod;
    meta.decoratorFactory = rawMeta.decoratorFactory;
    meta.declaredInDir = rawMeta.declaredInDir;
    this.checkWhetherIsExternalModule(rawMeta, meta);
    if ((isModuleWithParams(mod) || isAppendsWithParams(mod)) && mod.guards) {
      meta.guardsPerMod.push(...this.normalizeGuards(mod.guards));
      this.checkGuardsPerMod(meta.guardsPerMod, modName);
    }

    rawMeta.imports?.forEach((imp, i) => {
      imp = resolveForwardRef(imp);
      this.throwIfUndefined(modName, 'Imports', imp, i);
      if (isModuleWithParams(imp)) {
        meta.importsWithParams.push(imp);
      } else {
        meta.importsModules.push(imp);
      }
    });

    rawMeta.appends?.forEach((ap, i) => {
      ap = resolveForwardRef(ap);
      this.throwIfUndefined(modName, 'Appends', ap, i);
      if (isAppendsWithParams(ap)) {
        meta.appendsWithParams.push(ap);
      } else {
        meta.appendsWithParams.push({ path: '', module: ap });
      }
    });

    const providersTokens = getTokens([
      ...(rawMeta.providersPerMod || []),
      ...(rawMeta.providersPerRou || []),
      ...(rawMeta.providersPerReq || []),
    ]);

    const resolvedCollisionsPerScope = [
      ...(rawMeta.resolvedCollisionsPerMod || []),
      ...(rawMeta.resolvedCollisionsPerRou || []),
      ...(rawMeta.resolvedCollisionsPerReq || []),
    ];
    if (isRawRootModule(rawMeta)) {
      resolvedCollisionsPerScope.push(...(rawMeta.resolvedCollisionsPerApp || []));
    }
    resolvedCollisionsPerScope.forEach(([token]) => this.throwIfNormalizedProvider(modName, token));
    this.exportFromRawMeta(rawMeta, modName, providersTokens, meta);
    this.checkReexportModules(meta);

    rawMeta.extensions?.forEach((extensionOptions, i) => {
      this.checkExtensionOptions(modName, extensionOptions, i);
      const extensionObj = getExtensionProvider(extensionOptions);
      extensionObj.providers.forEach((p) => this.checkInitMethodForExtension(modName, p));
      if (!extensionObj.exportedOnly) {
        meta.extensionsProviders.push(...extensionObj.providers);
      }
      extensionObj.exports.forEach((token) => {
        this.throwExportsIfNormalizedProvider(modName, token);
        const exportedExtensions = extensionObj.providers.filter((provider) => getToken(provider) === token);
        meta.exportedExtensions.push(...exportedExtensions);
      });
    });

    this.pickMeta(meta, rawMeta);
    meta.extensionsMeta = { ...(meta.extensionsMeta || {}) };
    this.quickCheckMetadata(meta);
    meta.controllers.forEach((Controller) => this.checkController(modName, Controller));

    return meta;
  }

  protected checkController(modName: string, Controller: Class) {
    const decoratorsAndValues = reflector.getMetadata(Controller)?.constructor.decorators;
    if (!decoratorsAndValues?.find(isController)) {
      throw new Error(
        `Collecting controller's metadata in ${modName} failed: class ` +
          `"${Controller.name}" does not have the "@controller()" decorator.`,
      );
    }
  }

  protected checkExtensionOptions(modName: string, extensionOptions: ExtensionOptions, i: number) {
    if (!isOptionWithOverrideExtension(extensionOptions)) {
      // Previously, extensions had a `groupToken` property, which was renamed to `token`.
      if (!extensionOptions.token) {
        const msg = `Export of "${modName}" failed: extension in [${i}] index does not have "token" property.`;
        throw new TypeError(msg);
      }
    }
  }

  protected pickMeta(targetObject: NormalizedModuleMetadata, ...sourceObjects: ModuleMetadataWithContext[]) {
    const trgtObj = targetObject as any;
    sourceObjects.forEach((sourceObj: AnyObj) => {
      sourceObj ??= {};
      for (const prop in targetObject) {
        if (Array.isArray(sourceObj[prop])) {
          trgtObj[prop] = sourceObj[prop].slice();
        } else if (sourceObj[prop] instanceof Providers) {
          trgtObj[prop] = [...sourceObj[prop]];
        } else if (sourceObj[prop] !== undefined) {
          trgtObj[prop] = sourceObj[prop] as any;
        }
      }
    });

    return trgtObj;
  }

  protected checkWhetherIsExternalModule(rawMeta: ModuleMetadataWithContext, meta: NormalizedModuleMetadata) {
    meta.isExternal = false;
    if (isRawRootModule(rawMeta)) {
      this.rootDeclaredInDir = meta.declaredInDir;
    } else if (this.rootDeclaredInDir) {
      const { declaredInDir } = meta;
      if (this.rootDeclaredInDir !== '.' && declaredInDir !== '.') {
        // Case when getCallerDir() works correctly.
        meta.isExternal = !declaredInDir.startsWith(this.rootDeclaredInDir);
      }
    }
  }

  protected exportFromRawMeta(
    rawMeta: ModuleMetadata,
    modName: string,
    providersTokens: any[],
    meta: NormalizedModuleMetadata,
  ) {
    rawMeta.exports?.forEach((exp, i) => {
      exp = resolveForwardRef(exp);
      this.throwIfUndefined(modName, 'Exports', exp, i);
      this.throwExportsIfNormalizedProvider(modName, exp);
      if (isModuleWithParams(exp)) {
        meta.exportsWithParams.push(exp);
        if (exp.exports?.length) {
          this.exportFromRawMeta(exp, modName, providersTokens, meta);
        }
      } else if (isProvider(exp) || providersTokens.includes(exp)) {
        this.findAndSetProviders(exp, rawMeta, meta);
      } else if (getModuleMetadata(exp)) {
        meta.exportsModules.push(exp);
      } else {
        this.throwUnidentifiedToken(modName, exp);
      }
    });
  }

  protected checkReexportModules(meta: NormalizedModuleMetadata) {
    const imports = [...meta.importsModules, ...meta.importsWithParams].map(getModule);
    const exports = [...meta.exportsModules, ...meta.exportsWithParams].map(getModule);

    exports.forEach((mod) => {
      if (!imports.includes(mod)) {
        const msg =
          `Reexport from ${meta.name} failed: ${mod.name} includes in exports, but not includes in imports. ` +
          `In ${meta.name} you need include ${mod.name} to imports or remove it from exports.`;
        throw new Error(msg);
      }
    });
  }

  protected normalizeGuards(guards?: GuardItem[]) {
    return (guards || []).map((item) => {
      if (Array.isArray(item)) {
        return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
      } else {
        return { guard: item } as NormalizedGuard;
      }
    });
  }

  protected checkGuardsPerMod(guards: NormalizedGuard[], moduleName: string) {
    for (const Guard of guards.map((n) => n.guard)) {
      const type = typeof Guard?.prototype.canActivate;
      if (type != 'function') {
        throw new TypeError(
          `Import ${moduleName} with guards failed: Guard.prototype.canActivate must be a function, got: ${type}`,
        );
      }
    }
  }

  protected quickCheckMetadata(meta: NormalizedModuleMetadata) {
    if (
      !isNormRootModule(meta) &&
      !meta.providersPerApp.length &&
      !meta.controllers.length &&
      !meta.exportedProvidersPerMod.length &&
      !meta.exportedProvidersPerRou.length &&
      !meta.exportedProvidersPerReq.length &&
      !meta.exportedMultiProvidersPerMod.length &&
      !meta.exportedMultiProvidersPerRou.length &&
      !meta.exportedMultiProvidersPerReq.length &&
      !meta.exportsModules.length &&
      !meta.exportsWithParams.length &&
      !meta.exportedExtensions.length &&
      !meta.extensionsProviders.length
    ) {
      const moduleNames = [...this.unfinishedScanModules].map((mod) => getModuleName(mod)).join(' -> ') || meta.name;
      const msg =
        `Validation ${moduleNames} failed: this module should have "providersPerApp"` +
        ' or some controllers, or exports, or extensions.';
      throw new Error(msg);
    }
  }

  protected throwIfUndefined(
    modName: string,
    action: 'Imports' | 'Exports' | 'Appends',
    imp: AnyModule | Provider,
    i: number,
  ) {
    if (imp === undefined) {
      const lowerAction = action.toLowerCase();
      const msg =
        `${action} into "${modName}" failed: element at ${lowerAction}[${i}] has "undefined" type. ` +
        'This can be caused by circular dependency. Try to replace this element with this expression: ' +
        '"forwardRef(() => YourModule)".';
      throw new Error(msg);
    }
  }

  protected checkInitMethodForExtension(modName: string, extensionsProvider: ExtensionProvider) {
    const np = normalizeProviders([extensionsProvider])[0];
    let extensionClass: Class<Extension> | undefined;
    if (isClassProvider(np)) {
      extensionClass = np.useClass;
    } else if (isTokenProvider(np) && np.useToken instanceof Class) {
      extensionClass = np.useToken;
    } else if (isValueProvider(np) && np.useValue.constructor instanceof Class) {
      extensionClass = np.useValue.constructor;
    }

    if (!extensionClass || typeof extensionClass.prototype?.init != 'function') {
      const token = getToken(extensionsProvider);
      const tokenName = token.name || token;
      const msg = `Exporting "${tokenName}" from "${modName}" failed: all extensions must have init() method.`;
      throw new TypeError(msg);
    }
  }

  protected throwUnidentifiedToken(modName: string, token: any) {
    const tokenName = token.name || token;
    const msg =
      `Exporting from ${this.throwPath(modName)} failed: if "${tokenName}" is a token of a provider, this provider ` +
      'must be included in providersPerReq or in providersPerRou, or in providersPerMod. ' +
      `If "${tokenName}" is a token of extension, this extension must be included in "extensions" array.`;
    throw new TypeError(msg);
  }

  protected throwPath(modName: string) {
    if (this.unfinishedScanModules.size) {
      const path = [...this.unfinishedScanModules].map((mod) => getModuleName(mod)).join(' -> ');
      return `${modName} (${path})`;
    } else {
      return modName;
    }
  }

  protected throwIfNormalizedProvider(moduleName: string, provider: any) {
    if (isNormalizedProvider(provider)) {
      const providerName = provider.token.name || provider.token;
      const msg =
        `Resolving collisions in ${moduleName} failed: for ${providerName} inside ` +
        '"resolvedCollisionPer*" array must be includes tokens only.';
      throw new TypeError(msg);
    }
  }

  protected throwExportsIfNormalizedProvider(moduleName: string, provider: any) {
    if (isNormalizedProvider(provider)) {
      const providerName = provider.token.name || provider.token;
      const msg = `Exporting "${providerName}" from "${moduleName}" failed: in "exports" array must be includes tokens only.`;
      throw new TypeError(msg);
    }
  }

  protected findAndSetProviders(token: any, rawMeta: ModuleMetadata, meta: NormalizedModuleMetadata) {
    const scopes: Scope[] = ['Req', 'Rou', 'Mod'];
    let found = false;
    scopes.forEach((scope) => {
      const unfilteredProviders = [...(rawMeta[`providersPer${scope}`] || [])];
      const providers = unfilteredProviders.filter((p) => getToken(p) === token);
      if (providers.length) {
        found = true;
        if (providers.some(isMultiProvider)) {
          meta[`exportedMultiProvidersPer${scope}`].push(...(providers as MultiProvider[]));
        } else {
          meta[`exportedProvidersPer${scope}`].push(...providers);
        }
      }
    });

    if (!found) {
      const providerName = token.name || token;
      let msg = '';
      const providersPerApp = [...(rawMeta.providersPerApp || [])];
      if (providersPerApp.some((p) => getToken(p) === token)) {
        msg =
          `Exported "${providerName}" includes in "providersPerApp" and "exports" of ${meta.name}. ` +
          'This is an error, because "providersPerApp" is always exported automatically.';
      } else {
        msg =
          `Exporting from ${meta.name} failed: if "${providerName}" is a provider, it must be included ` +
          'in "providersPerMod" or "providersPerRou", or "providersPerReq".';
      }
      throw new Error(msg);
    }
  }
}
