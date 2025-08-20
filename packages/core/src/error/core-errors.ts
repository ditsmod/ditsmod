import { CustomError } from './custom-error.js';

/**
 * `Repeated saving of module metadata snapshots is prohibited. It is done only once—after their normalization.`
 */
export class ProhibitSavingModulesSnapshot extends CustomError {
  constructor() {
    super({
      msg1: 'Repeated saving of module metadata snapshots is prohibited. It is done only once - after their normalization.',
      level: 'warn',
    });
  }
}
/**
 * `Importing providers to ${moduleName} failed: exports ${fromModules}causes collision with ${namesStr}.
 * You should add ${tokenNames} to ${resolvedCollisionsPer} in this module.${example}`
 */
export class ProvidersCollision extends CustomError {
  constructor(
    moduleName: string,
    duplicates: any[],
    fromModuleNames: string[] = [],
    level?: string,
    isExternal?: boolean,
  ) {
    const aTokens = duplicates.map((p) => p.name || p);
    const tokenNames = aTokens.join(', ');
    let fromModules = 'from several modules ';
    let example = '';
    if (fromModuleNames.length) {
      fromModules = `from ${fromModuleNames.join(', ')} `;
      example = ` For example: resolvedCollisionsPer${level || 'App'}: [ [${aTokens[0]}, ${fromModuleNames[0]}] ].`;
    }
    const resolvedCollisionsPer = level ? `resolvedCollisionsPer${level}` : 'resolvedCollisionsPer*';
    let msg1 = `Importing providers to ${moduleName} failed: exports ${fromModules}causes collision with ${tokenNames}. `;
    if (!isExternal) {
      msg1 += `You should add ${tokenNames} to ${resolvedCollisionsPer} in this module.${example}`;
    }
    super({
      msg1,
      level: 'fatal',
    });
  }
}
/**
 * `Resolving collisions for providersPer${level} in ${moduleName} failed:
 * ${tokenName} mapped with ${moduleName}, but
 * providersPer${level} does not imports ${tokenName} in this module.`
 */
export class ResolvingCollisionsNotImportedInModule extends CustomError {
  constructor(moduleName: string, level: string, tokenName: string) {
    super({
      msg1:
        `Resolving collisions for providersPer${level} in ${moduleName} failed: ` +
        `${tokenName} mapped with ${moduleName}, but ` +
        `providersPer${level} does not imports ${tokenName} in this module.`,
      level: 'fatal',
    });
  }
}
/**
 * `Resolving collisions for providersPer${level} in ${moduleName1} failed:
 * ${tokenName} mapped with ${moduleName2}, but ${tokenName} is a token of the multi providers,
 * and in this case it should not be included in resolvedCollisionsPer${level}.`
 */
export class CannotResolveCollisionForMultiProviderPerLevel extends CustomError {
  constructor(moduleName1: string, moduleName2: string, level: string, tokenName: string) {
    super({
      msg1:
        `Resolving collisions for providersPer${level} in ${moduleName1} failed: ` +
        `${tokenName} mapped with ${moduleName2}, but ${tokenName} is a token of the multi providers, ` +
        `and in this case it should not be included in resolvedCollisionsPer${level}.`,
      level: 'fatal',
    });
  }
}
/**
 * `Resolving collisions for providersPerApp in ${rootModuleName} failed:
 * ${tokenName} mapped with ${moduleName}, but ${tokenName} is a token of the multi providers,
 * and in this case it should not be included in resolvedCollisionsPerApp.`
 */
export class CannotResolveCollisionForMultiProviderPerApp extends CustomError {
  constructor(rootModuleName: string, moduleName: string, tokenName: string) {
    super({
      msg1:
        `Resolving collisions for providersPerApp in ${rootModuleName} failed: ` +
        `${tokenName} mapped with ${moduleName}, but ${tokenName} is a token of the multi providers, and in this case ` +
        'it should not be included in resolvedCollisionsPerApp.',
      level: 'fatal',
    });
  }
}
/**
 * `A configuration of extensions in ${moduleName}
 * creates a cyclic dependency in the startup sequence of different groups: ${strPath}.`
 */
export class ExtensionConfigCauseCyclicDeps extends CustomError {
  constructor(moduleName: string, strPath: string) {
    super({
      msg1:
        `A configuration of extensions in ${moduleName} ` +
        `creates a cyclic dependency in the startup sequence of different groups: ${strPath}.`,
      level: 'fatal',
    });
  }
}
/**
 * `Resolving collisions for providersPer${level} in ${moduleName1} failed:
 * ${tokenName} mapped with ${moduleName2}, but providersPer${level} does not includes ${tokenName} in this module.`
 */
export class ResolvingCollisionsNotExistsOnThisLevel extends CustomError {
  constructor(moduleName1: string, moduleName2: string, level: string, tokenName: string) {
    super({
      msg1:
        `Resolving collisions for providersPer${level} in ${moduleName1} failed: ` +
        `${tokenName} mapped with ${moduleName2}, but providersPer${level} does not includes ${tokenName} in this module.`,
      level: 'fatal',
    });
  }
}
/**
 * `Resolving collisions for providersPerApp in ${rootModuleName} failed:
 * ${tokenName} mapped with ${moduleName}, but providersPerApp does not includes ${tokenName} in this module.`
 */
export class ProvidersPerAppMissingTokenName extends CustomError {
  constructor(rootModuleName: string, moduleName: string, tokenName: string) {
    super({
      msg1:
        `Resolving collisions for providersPerApp in ${rootModuleName} failed: ` +
        `${tokenName} mapped with ${moduleName}, but providersPerApp does not includes ${tokenName} in this module.`,
      level: 'fatal',
    });
  }
}
/**
 * `Resolving collisions for providersPer${level} in ${moduleName1} failed:
 * ${tokenName} mapped with ${moduleName2}, but ${moduleName1} is not imported into the application.`
 */
export class ResolvingCollisionsNotImportedInApplication extends CustomError {
  constructor(moduleName1: string, moduleName2: string, level: string, tokenName: string) {
    super({
      msg1:
        `Resolving collisions for providersPer${level} in ${moduleName1} failed: ` +
        `${tokenName} mapped with ${moduleName2}, but ${moduleName1} is not imported into the application.`,
      level: 'fatal',
    });
  }
}
/**
 * `this module should have "providersPerApp", or exports, or extensions.`
 */
export class ModuleShouldHaveValue extends CustomError {
  constructor() {
    super({
      msg1: 'this module should have "providersPerApp", or exports, or extensions.',
      level: 'fatal',
    });
  }
}
/**
 * `Exported "${providerName}" includes in "providersPerApp" and "exports" of ${moduleName}.
 * This is an error, because "providersPerApp" is always exported automatically.`
 */
export class ForbiddenExportProvidersPerApp extends CustomError {
  constructor(moduleName: string, providerName: string) {
    super({
      msg1:
        `Exported "${providerName}" includes in "providersPerApp" and "exports" of ${moduleName}. ` +
        'This is an error, because "providersPerApp" is always exported automatically.',
      level: 'fatal',
    });
  }
}
/**
 * `Exporting "${providerName}" from "${moduleName}" failed: in "exports" array must be includes tokens only.`
 */
export class ForbiddenExportNormalizedProvider extends CustomError {
  constructor(moduleName: string, providerName: string) {
    super({
      msg1: `Exporting "${providerName}" from "${moduleName}" failed: in "exports" array must be includes tokens only.`,
      level: 'fatal',
    });
  }
}
/**
 * `Exporting from ${moduleName} failed: if "${tokenName}" is a token of a provider, this provider
 * must be included in providersPerMod. If "${tokenName}" is a module, it must have "featureModule" decorator.`
 */
export class ExportingUnknownSymbol extends CustomError {
  constructor(moduleName: string, tokenName: string) {
    super({
      msg1:
        `Exporting from ${moduleName} failed: if "${tokenName}" is a token of a provider, this provider ` +
        'must be included in providersPerMod. ' +
        `If "${tokenName}" is a module, it must have "featureModule" decorator.`,
      level: 'fatal',
    });
  }
}
/**
 * `Exporting "${tokenName}" from "${moduleName}" failed: all extensions must have stage1(), stage2() or stage3() method.`
 */
export class InvalidExtension extends CustomError {
  constructor(moduleName: string, tokenName: string) {
    super({
      msg1: `Exporting "${tokenName}" from "${moduleName}" failed: all extensions must have stage1(), stage2() or stage3() method.`,
      level: 'fatal',
    });
  }
}
/**
 * `Reexport from ${moduleName} failed: ${importedModuleName} includes in exports,
 * but not includes in imports. If in ${moduleName} you imports ${importedModuleName} as
 * module with params, same object you should export (if you need reexport).`
 */
export class ReexportFailed extends CustomError {
  constructor(moduleName: string, importedModuleName: string) {
    super({
      msg1:
        `Reexport from ${moduleName} failed: ${importedModuleName} includes in exports, ` +
        `but not includes in imports. If in ${moduleName} you imports ${importedModuleName} as ` +
        'module with params, same object you should export (if you need reexport).',
      level: 'fatal',
    });
  }
}
/**
 * `${action} into "${moduleName}" failed: element at ${lowerAction}[${i}] has "undefined" type.
 * This can be caused by circular dependency. Try to replace this element with this expression:
 * "forwardRef(() => YourModule)".`
 */
export class UndefinedModule extends CustomError {
  constructor(action: string, moduleName: string, i: number) {
    const lowerAction = action.toLowerCase();
    super({
      msg1:
        `${action} into "${moduleName}" failed: element at ${lowerAction}[${i}] has "undefined" type. ` +
        'This can be caused by circular dependency. Try to replace this element with this expression: ' +
        '"forwardRef(() => YourModule)".',
      level: 'fatal',
    });
  }
}
/**
 * `Resolving collisions in ${moduleName} failed: for ${providerName} inside
 * "resolvedCollisionPer*" array must be includes tokens only.`
 */
export class ResolvedCollisionTokensOnly extends CustomError {
  constructor(moduleName: string, providerName: string) {
    super({
      msg1:
        `Resolving collisions in ${moduleName} failed: for ${providerName} inside ` +
        '"resolvedCollisionPer*" array must be includes tokens only.',
      level: 'fatal',
    });
  }
}
/**
 * `module "${modName}" does not have the "@rootModule()" or "@featureModule()" decorator`
 */
export class ModuleDoesNotHaveDecorator extends CustomError {
  constructor(modName: string) {
    super({
      msg1: `module "${modName}" does not have the "@rootModule()" or "@featureModule()" decorator`,
      level: 'fatal',
    });
  }
}
/**
 * `The passed argument - modRefId - is not a class, and is not a module with a parameter.`
 */
export class InvalidModRefId extends CustomError {
  constructor() {
    super({
      msg1: 'The passed argument - modRefId - is not a class, and is not a module with a parameter.',
      level: 'fatal',
    });
  }
}
/**
 * `Detected circular dependencies: ${circularNames}.`
 */
export class CircularDepsInImports extends CustomError {
  constructor(circularNames: string, prefixNames?: string) {
    let msg1 = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg1 += ` It is started from ${prefixNames}.`;
    }
    super({
      msg1,
      level: 'fatal',
    });
  }
}
/**
 * `Initialization failed in ${debugModuleName} -> ${extensionName} at stage 3`
 */
export class FailedStage3 extends CustomError {
  constructor(debugModuleName: string, extensionName: string, cause: any) {
    super(
      {
        msg1: `Initialization failed in ${debugModuleName} -> ${extensionName} at stage 3`,
        level: 'fatal',
      },
      cause,
    );
  }
}
/**
 * `Initialization in ${debugModuleName} -> ${ext.constructor.name} at stage 2 failed`
 */
export class FailedStage2 extends CustomError {
  constructor(debugModuleName: string, extensionName: string, cause: any) {
    super(
      {
        msg1: `Initialization in ${debugModuleName} -> ${extensionName} at stage 2 failed`,
        level: 'fatal',
      },
      cause,
    );
  }
}
/**
 * `Failed create injector per module for ${debugModuleName}`
 */
export class FailedCreateInjectorPerMod extends CustomError {
  constructor(debugModuleName: string, cause: any) {
    super(
      {
        msg1: `Failed create injector per module for ${debugModuleName}`,
        level: 'fatal',
      },
      cause,
    );
  }
}
/**
 * `Metadata collection from all modules for ${groupName} failed`
 */
export class FailedCollectingMetadata extends CustomError {
  constructor(groupName: string, cause: any) {
    super(
      {
        msg1: `Metadata collection from all modules for ${groupName} failed`,
        level: 'fatal',
      },
      cause,
    );
  }
}
/**
 * `Resolving collisions for providersPerApp in ${rootModuleName} failed:
 * ${tokenName} mapped with ${moduleName}, but ${moduleName} is not imported into the application.`
 */
export class ModuleNotImportedInApplication extends CustomError {
  constructor(rootModuleName: string, moduleName: string, tokenName: string) {
    super({
      msg1:
        `Resolving collisions for providersPerApp in ${rootModuleName} failed: ` +
        `${tokenName} mapped with ${moduleName}, but ${moduleName} is not imported into the application.`,
      level: 'fatal',
    });
  }
}
/**
 * The logger was not previously seted.
 */
export class LoggerNotSet extends CustomError {
  constructor() {
    super({
      msg1: 'The logger was not previously seted.',
      level: 'warn',
    });
  }
}
/**
 * `${ExtCls.name} is failed`
 */
export class ExtensionFailed extends CustomError {
  constructor(extensionName: string, moduleName: string, cause: Error) {
    super(
      {
        msg1: `${extensionName} in ${moduleName} is failed`,
        level: 'fatal',
      },
      cause,
    );
  }
}
/**
 * `Detected circular dependencies: ${circularNames}.`
 */
export class CircularDepsBetweenExtensions extends CustomError {
  constructor(circularNames: string, prefixNames?: string) {
    let msg1 = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg1 += ` It is started from ${prefixNames}.`;
    }
    super({
      msg1,
      level: 'fatal',
    });
  }
}
/**
 * {@link extensionName1} attempted to call "extensionsManager.stage1({@link extensionName2})",
 * but {@link extensionName2} not declared in "afterExtensions" array in this module.
 */
export class NotDeclaredInAfterExtensionList extends CustomError {
  constructor(extensionName1: string, extensionName2: string) {
    super({
      msg1:
        `${extensionName1} attempted to call "extensionsManager.stage1(${extensionName2})", ` +
        `but ${extensionName2} not declared in "afterExtensions" array in this module.`,
      level: 'fatal',
    });
  }
}
/**
 * `Failed to resolve imported dependencies for ${moduleName}: no provider for ${tokenName}! ${partMsg}.`
 */
export class NoProviderDuringResolveImports extends CustomError {
  constructor(moduleName: string, tokenName: string, partMsg: string) {
    super({
      msg1: `Failed to resolve imported dependencies for ${moduleName}: no provider for ${tokenName}! ${partMsg}.`,
      level: 'fatal',
    });
  }
}
/**
 * `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator`.
 */
export class RootNotHaveDecorator extends CustomError {
  constructor(rootModuleName: string) {
    super({
      msg1: `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator.`,
      level: 'fatal',
    });
  }
}
/**
 * `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`
 */
export class FailAddingToImports extends CustomError {
  constructor(modName?: string, modIdStr?: string) {
    super({
      msg1: `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`,
      level: 'warn',
    });
  }
}
/**
 * `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`
 */
export class FailRemovingImport extends CustomError {
  constructor(inputModName: string, modIdStr: string) {
    super({
      msg1: `Failed removing ${inputModName} from "imports" array: target module with ID "${modIdStr}" not found.`,
      level: 'warn',
    });
  }
}
/**
 * 'It is forbidden for rollback() to an empty state.'
 */
export class ForbiddenRollbackEmptyState extends CustomError {
  constructor() {
    super({
      msg1: 'It is forbidden for rollback() to an empty state.',
      level: 'warn',
    });
  }
}
/**
 * `${moduleId} not found in ModuleManager.`
 */
export class ModuleIdNotFoundInModuleManager extends CustomError {
  constructor(moduleId: string) {
    super({
      msg1: `${moduleId} not found in ModuleManager.`,
      level: 'warn',
    });
  }
}
/**
 * `Normalization of ${moduleName} failed`
 */
export class NormalizationFailed extends CustomError {
  constructor(moduleName: string, err: Error) {
    super(
      {
        msg1: `Normalization of ${moduleName} failed`,
        level: 'fatal',
      },
      err,
    );
  }
}
