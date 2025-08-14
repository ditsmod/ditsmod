import { newCustomError } from './custom-error.js';

export const systemErrors = {
  /**
   * `Resolving collisions for providersPer${level} in ${moduleName} failed:
   * ${tokenName} mapped with ${moduleName}, but
   * providersPer${level} does not imports ${tokenName} in this module.`
   */
  resolvingCollisionsNotImportedInModule(moduleName: string, level: string, tokenName: string) {
    return newCustomError(systemErrors.resolvingCollisionsNotImportedInModule, {
      msg1:
        `Resolving collisions for providersPer${level} in ${moduleName} failed: ` +
        `${tokenName} mapped with ${moduleName}, but ` +
        `providersPer${level} does not imports ${tokenName} in this module.`,
      level: 'fatal',
    });
  },
  /**
   * `Resolving collisions for providersPer${level} in ${moduleName1} failed:
   * ${tokenName} mapped with ${moduleName2}, but ${tokenName} is a token of the multi providers,
   * and in this case it should not be included in resolvedCollisionsPer${level}.`
   */
  tryResolvingMultiprovidersCollisions(moduleName1: string, moduleName2: string, level: string, tokenName: string) {
    return newCustomError(systemErrors.tryResolvingMultiprovidersCollisions, {
      msg1:
        `Resolving collisions for providersPer${level} in ${moduleName1} failed: ` +
        `${tokenName} mapped with ${moduleName2}, but ${tokenName} is a token of the multi providers, ` +
        `and in this case it should not be included in resolvedCollisionsPer${level}.`,
      level: 'fatal',
    });
  },
  /**
   * `A configuration of extensions in ${moduleName}
   * creates a cyclic dependency in the startup sequence of different groups: ${strPath}.`
   */
  extensionConfigCauseCyclicDeps(moduleName: string, strPath: string) {
    return newCustomError(systemErrors.extensionConfigCauseCyclicDeps, {
      msg1:
        `A configuration of extensions in ${moduleName} ` +
        `creates a cyclic dependency in the startup sequence of different groups: ${strPath}.`,
      level: 'fatal',
    });
  },
  /**
   * `Resolving collisions for providersPer${level} in ${moduleName1} failed:
   * ${tokenName} mapped with ${moduleName2}, but providersPer${level} does not includes ${tokenName} in this module.`
   */
  resolvingCollisionsNotExistsOnThisLevel(moduleName1: string, moduleName2: string, level: string, tokenName: string) {
    return newCustomError(systemErrors.resolvingCollisionsNotExistsOnThisLevel, {
      msg1:
        `Resolving collisions for providersPer${level} in ${moduleName1} failed: ` +
        `${tokenName} mapped with ${moduleName2}, but providersPer${level} does not includes ${tokenName} in this module.`,
      level: 'fatal',
    });
  },
  /**
   * `Resolving collisions for providersPer${level} in ${moduleName1} failed:
   * ${tokenName} mapped with ${moduleName2}, but ${moduleName1} is not imported into the application.`
   */
  resolvingCollisionsNotImportedInApplication(
    moduleName1: string,
    moduleName2: string,
    level: string,
    tokenName: string,
  ) {
    return newCustomError(systemErrors.resolvingCollisionsNotImportedInApplication, {
      msg1:
        `Resolving collisions for providersPer${level} in ${moduleName1} failed: ` +
        `${tokenName} mapped with ${moduleName2}, but ${moduleName1} is not imported into the application.`,
      level: 'fatal',
    });
  },
  /**
   * `this module should have "providersPerApp", or exports, or extensions.`
   */
  moduleShouldHaveValue() {
    return newCustomError(systemErrors.moduleShouldHaveValue, {
      msg1: 'this module should have "providersPerApp", or exports, or extensions.',
      level: 'fatal',
    });
  },
  /**
   * `Exported "${providerName}" includes in "providersPerApp" and "exports" of ${moduleName}.
   * This is an error, because "providersPerApp" is always exported automatically.`
   */
  forbiddenExportProvidersPerApp(moduleName: string, providerName: string) {
    return newCustomError(systemErrors.forbiddenExportProvidersPerApp, {
      msg1:
        `Exported "${providerName}" includes in "providersPerApp" and "exports" of ${moduleName}. ` +
        'This is an error, because "providersPerApp" is always exported automatically.',
      level: 'fatal',
    });
  },
  /**
   * `Exporting "${providerName}" from "${moduleName}" failed: in "exports" array must be includes tokens only.`
   */
  forbiddenExportNormalizedProvider(moduleName: string, providerName: string) {
    return newCustomError(systemErrors.forbiddenExportNormalizedProvider, {
      msg1: `Exporting "${providerName}" from "${moduleName}" failed: in "exports" array must be includes tokens only.`,
      level: 'fatal',
    });
  },
  /**
   * `Exporting from ${moduleName} failed: if "${tokenName}" is a token of a provider, this provider
   * must be included in providersPerMod. If "${tokenName}" is a module, it must have "featureModule" decorator.
   * If "${tokenName}" is a token of extension, this extension must be included in "extensions" array.`
   */
  exportingUnknownSymbol(moduleName: string, tokenName: string) {
    return newCustomError(systemErrors.exportingUnknownSymbol, {
      msg1:
        `Exporting from ${moduleName} failed: if "${tokenName}" is a token of a provider, this provider ` +
        'must be included in providersPerMod. ' +
        `If "${tokenName}" is a module, it must have "featureModule" decorator. ` +
        `If "${tokenName}" is a token of extension, this extension must be included in "extensions" array.`,
      level: 'fatal',
    });
  },
  /**
   * `Exporting "${tokenName}" from "${moduleName}" failed: all extensions must have stage1(), stage2() or stage3() method.`
   */
  wrongExtension(moduleName: string, tokenName: string) {
    return newCustomError(systemErrors.wrongExtension, {
      msg1: `Exporting "${tokenName}" from "${moduleName}" failed: all extensions must have stage1(), stage2() or stage3() method.`,
      level: 'fatal',
    });
  },
  /**
   * `Reexport from ${moduleName} failed: ${importedModuleName} includes in exports,
   * but not includes in imports. If in ${moduleName} you imports ${importedModuleName} as
   * module with params, same object you should export (if you need reexport).`
   */
  reexportFailed(moduleName: string, importedModuleName: string) {
    return newCustomError(systemErrors.reexportFailed, {
      msg1:
        `Reexport from ${moduleName} failed: ${importedModuleName} includes in exports, ` +
        `but not includes in imports. If in ${moduleName} you imports ${importedModuleName} as ` +
        'module with params, same object you should export (if you need reexport).',
      level: 'fatal',
    });
  },
  /**
   * `${action} into "${moduleName}" failed: element at ${lowerAction}[${i}] has "undefined" type.
   * This can be caused by circular dependency. Try to replace this element with this expression:
   * "forwardRef(() => YourModule)".`
   */
  moduleIsUndefined(action: string, moduleName: string, i: number) {
    const lowerAction = action.toLowerCase();
    return newCustomError(systemErrors.moduleIsUndefined, {
      msg1:
        `${action} into "${moduleName}" failed: element at ${lowerAction}[${i}] has "undefined" type. ` +
        'This can be caused by circular dependency. Try to replace this element with this expression: ' +
        '"forwardRef(() => YourModule)".',
      level: 'fatal',
    });
  },
  /**
   * `Resolving collisions in ${moduleName} failed: for ${providerName} inside
   * "resolvedCollisionPer*" array must be includes tokens only.`
   */
  inResolvedCollisionTokensOnly(moduleName: string, providerName: string) {
    return newCustomError(systemErrors.inResolvedCollisionTokensOnly, {
      msg1:
        `Resolving collisions in ${moduleName} failed: for ${providerName} inside ` +
        '"resolvedCollisionPer*" array must be includes tokens only.',
      level: 'fatal',
    });
  },
  /**
   * `module "${modName}" does not have the "@rootModule()" or "@featureModule()" decorator`
   */
  moduleDoesNotHaveDecorator(modName: string) {
    return newCustomError(systemErrors.moduleDoesNotHaveDecorator, {
      msg1: `module "${modName}" does not have the "@rootModule()" or "@featureModule()" decorator`,
      level: 'fatal',
    });
  },
  /**
   * `The passed argument - modRefId - is not a class, and is not a module with a parameter.`
   */
  wrongModRefId() {
    return newCustomError(systemErrors.wrongModRefId, {
      msg1: 'The passed argument - modRefId - is not a class, and is not a module with a parameter.',
      level: 'fatal',
    });
  },
  /**
   * `Detected circular dependencies: ${circularNames}.`
   */
  circularDepsInImports(circularNames: string, prefixNames?: string) {
    let msg1 = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg1 += ` It is started from ${prefixNames}.`;
    }
    return newCustomError(systemErrors.circularDepsInImports, {
      msg1,
      level: 'fatal',
    });
  },
  /**
   * `Initialization failed in ${debugModuleName} -> ${extensionName} at stage 3`
   */
  failedStage3(debugModuleName: string, extensionName: string, cause: any) {
    return newCustomError(
      systemErrors.failedStage3,
      {
        msg1: `Initialization failed in ${debugModuleName} -> ${extensionName} at stage 3`,
        level: 'fatal',
      },
      cause,
    );
  },
  /**
   * `Initialization in ${debugModuleName} -> ${ext.constructor.name} at stage 2 failed`
   */
  failedStage2(debugModuleName: string, extensionName: string, cause: any) {
    return newCustomError(
      systemErrors.failedStage2,
      {
        msg1: `Initialization in ${debugModuleName} -> ${extensionName} at stage 2 failed`,
        level: 'fatal',
      },
      cause,
    );
  },
  /**
   * `Failed create injector per module for ${debugModuleName}`
   */
  failedCreateInjectorPerMod(debugModuleName: string, cause: any) {
    return newCustomError(
      systemErrors.failedCreateInjectorPerMod,
      {
        msg1: `Failed create injector per module for ${debugModuleName}`,
        level: 'fatal',
      },
      cause,
    );
  },
  /**
   * `Metadata collection from all modules for ${groupName} failed`
   */
  failedCollectingMetadata(groupName: string, cause: any) {
    return newCustomError(
      systemErrors.failedCollectingMetadata,
      {
        msg1: `Metadata collection from all modules for ${groupName} failed`,
        level: 'fatal',
      },
      cause,
    );
  },
  /**
   * `Resolving collisions for providersPerApp in ${rootModuleName} failed:
   * ${tokenName} mapped with ${moduleName}, but ${tokenName} is a token of the multi providers,
   * and in this case it should not be included in resolvedCollisionsPerApp.`
   */
  multiProviderShouldNotBIncludedInResolvedCollisionsPerApp(
    rootModuleName: string,
    moduleName: string,
    tokenName: string,
  ) {
    return newCustomError(systemErrors.multiProviderShouldNotBIncludedInResolvedCollisionsPerApp, {
      msg1:
        `Resolving collisions for providersPerApp in ${rootModuleName} failed: ` +
        `${tokenName} mapped with ${moduleName}, but ${tokenName} is a token of the multi providers, and in this case ` +
        'it should not be included in resolvedCollisionsPerApp.',
      level: 'fatal',
    });
  },
  /**
   * `Resolving collisions for providersPerApp in ${rootModuleName} failed:
   * ${tokenName} mapped with ${moduleName}, but providersPerApp does not includes ${tokenName} in this module.`
   */
  providersPerAppDoesNotIncludesTokenName(rootModuleName: string, moduleName: string, tokenName: string) {
    return newCustomError(systemErrors.providersPerAppDoesNotIncludesTokenName, {
      msg1:
        `Resolving collisions for providersPerApp in ${rootModuleName} failed: ` +
        `${tokenName} mapped with ${moduleName}, but providersPerApp does not includes ${tokenName} in this module.`,
      level: 'fatal',
    });
  },
  /**
   * `Resolving collisions for providersPerApp in ${rootModuleName} failed:
   * ${tokenName} mapped with ${moduleName}, but ${moduleName} is not imported into the application.`
   */
  moduleNotImportedInApplication(rootModuleName: string, moduleName: string, tokenName: string) {
    return newCustomError(systemErrors.moduleNotImportedInApplication, {
      msg1:
        `Resolving collisions for providersPerApp in ${rootModuleName} failed: ` +
        `${tokenName} mapped with ${moduleName}, but ${moduleName} is not imported into the application.`,
      level: 'fatal',
    });
  },
  /**
   * The logger was not previously seted.
   */
  loggerWasNotPreviouslySeted() {
    return newCustomError(systemErrors.loggerWasNotPreviouslySeted, {
      msg1: 'The logger was not previously seted.',
      level: 'warn',
    });
  },
  /**
   * `${ExtCls.name} is failed`
   */
  extensionIsFailed(extensionName: string, moduleName: string, cause: Error) {
    return newCustomError(
      systemErrors.extensionIsFailed,
      {
        msg1: `${extensionName} in ${moduleName} is failed`,
        level: 'fatal',
      },
      cause,
    );
  },
  /**
   * `Detected circular dependencies: ${circularNames}.`
   */
  detectedCircularDependenciesForExtensions(prefixNames: string, circularNames: string) {
    let msg1 = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg1 += ` It is started from ${prefixNames}.`;
    }
    return newCustomError(systemErrors.detectedCircularDependenciesForExtensions, {
      msg1,
      level: 'fatal',
    });
  },
  /**
   * {@link extensionName1} attempted to call "extensionsManager.stage1({@link extensionName2})",
   * but {@link extensionName2} not declared in "afterExtensions" array in this module.
   */
  notDeclaredInAfterExtensionList(extensionName1: string, extensionName2: string) {
    return newCustomError(systemErrors.notDeclaredInAfterExtensionList, {
      msg1:
        `${extensionName1} attempted to call "extensionsManager.stage1(${extensionName2})", ` +
        `but ${extensionName2} not declared in "afterExtensions" array in this module.`,
      level: 'fatal',
    });
  },
  /**
   * `Failed to resolve imported dependencies for ${moduleName}: no provider for ${tokenName}! ${partMsg}.`
   */
  noProviderDuringResolveImports(moduleName: string, tokenName: string, partMsg: string) {
    return newCustomError(systemErrors.noProviderDuringResolveImports, {
      msg1: `Failed to resolve imported dependencies for ${moduleName}: no provider for ${tokenName}! ${partMsg}.`,
      level: 'fatal',
    });
  },
  /**
   * `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator`.
   */
  rootNotHaveDecorator(rootModuleName: string) {
    return newCustomError(systemErrors.rootNotHaveDecorator, {
      msg1: `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator.`,
      level: 'fatal',
    });
  },
  /**
   * `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`
   */
  failAddingToImports(modName?: string, modIdStr?: string) {
    return newCustomError(systemErrors.failAddingToImports, {
      msg1: `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`,
      level: 'warn',
    });
  },
  /**
   * `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`
   */
  failRemovingImport(inputModName: string, modIdStr: string) {
    return newCustomError(systemErrors.failRemovingImport, {
      msg1: `Failed removing ${inputModName} from "imports" array: target module with ID "${modIdStr}" not found.`,
      level: 'warn',
    });
  },
  /**
   * 'It is forbidden for rollback() to an empty state.'
   */
  forbiddenRollbackEemptyState() {
    return newCustomError(systemErrors.forbiddenRollbackEemptyState, {
      msg1: 'It is forbidden for rollback() to an empty state.',
      level: 'warn',
    });
  },
  /**
   * `${moduleId} not found in ModuleManager.`
   */
  moduleIdNotFoundInModuleManager(moduleId: string) {
    return newCustomError(systemErrors.moduleIdNotFoundInModuleManager, {
      msg1: `${moduleId} not found in ModuleManager.`,
      level: 'warn',
    });
  },
  /**
   * `Normalization of ${path} failed`
   */
  normalizationFailed(path: string, err: Error) {
    return newCustomError(
      systemErrors.normalizationFailed,
      {
        msg1: `Normalization of ${path} failed`,
        level: 'fatal',
      },
      err,
    );
  },
};
