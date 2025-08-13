import { CustomError } from './custom-error.js';

export const systemErrors = {
  /**
   * The logger was not previously seted.
   */
  loggerWasNotPreviouslySeted() {
    return new CustomError({
      code: systemErrors.loggerWasNotPreviouslySeted.name,
      msg1: 'The logger was not previously seted.',
      level: 'warn',
    });
  },
  /**
   * `${ExtCls.name} in ${moduleName} failed`
   */
  extensionIsFailed(extensionName: string, moduleName: string, cause: Error) {
    return new CustomError(
      {
        code: systemErrors.extensionIsFailed.name,
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
    return new CustomError({
      code: systemErrors.detectedCircularDependenciesForExtensions.name,
      msg1,
      level: 'fatal',
    });
  },
  /**
   * {@link extensionName1} attempted to call "extensionsManager.stage1({@link extensionName2})",
   * but {@link extensionName2} not declared in "afterExtensions" array in this module.
   */
  notDeclaredInAfterExtensionList(extensionName1: string, extensionName2: string) {
    return new CustomError({
      code: systemErrors.notDeclaredInAfterExtensionList.name,
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
    return new CustomError({
      code: systemErrors.noProviderDuringResolveImports.name,
      msg1: `Failed to resolve imported dependencies for ${moduleName}: no provider for ${tokenName}! ${partMsg}.`,
      level: 'fatal',
    });
  },
  /**
   * `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator`.
   */
  rootNotHaveDecorator(rootModuleName: string) {
    return new CustomError({
      code: systemErrors.rootNotHaveDecorator.name,
      msg1: `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator.`,
      level: 'fatal',
    });
  },
  /**
   * `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`
   */
  failAddingToImports(modName?: string, modIdStr?: string) {
    return new CustomError({
      code: systemErrors.failAddingToImports.name,
      msg1: `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`,
      level: 'warn',
    });
  },
  /**
   * `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`
   */
  failRemovingImport(inputModName: string, modIdStr: string) {
    return new CustomError({
      code: systemErrors.failRemovingImport.name,
      msg1: `Failed removing ${inputModName} from "imports" array: target module with ID "${modIdStr}" not found.`,
      level: 'warn',
    });
  },
  /**
   * 'It is forbidden for rollback() to an empty state.'
   */
  forbiddenRollbackEemptyState() {
    return new CustomError({
      code: systemErrors.forbiddenRollbackEemptyState.name,
      msg1: 'It is forbidden for rollback() to an empty state.',
      level: 'warn',
    });
  },
  /**
   * `${moduleId} not found in ModuleManager.`
   */
  moduleIdNotFoundInModuleManager(moduleId: string) {
    return new CustomError({
      code: systemErrors.moduleIdNotFoundInModuleManager.name,
      msg1: `${moduleId} not found in ModuleManager.`,
      level: 'warn',
    });
  },
  /**
   * `Normalization of ${path} failed`
   */
  normalizationFailed(path: string, err: Error) {
    return new CustomError(
      {
        code: systemErrors.normalizationFailed.name,
        msg1: `Normalization of ${path} failed`,
        level: 'fatal',
      },
      err,
    );
  },
};
