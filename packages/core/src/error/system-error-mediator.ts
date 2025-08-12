import { CustomError } from './custom-error.js';

export class SystemErrorMediator {
  /**
   * The logger was not previously seted.
   */
  static loggerWasNotPreviouslySeted() {
    return new CustomError({
      code: SystemErrorMediator.loggerWasNotPreviouslySeted.name,
      msg1: 'The logger was not previously seted.',
      level: 'warn',
    });
  }
  /**
   * `${ExtCls.name} in ${moduleName} failed`
   */
  static extensionIsFailed(extensionName: string, moduleName: string, cause: Error) {
    return new CustomError(
      {
        code: SystemErrorMediator.extensionIsFailed.name,
        msg1: `${extensionName} in ${moduleName} is failed`,
        level: 'fatal',
      },
      cause,
    );
  }
  /**
   * `Detected circular dependencies: ${circularNames}.`
   */
  static detectedCircularDependenciesForExtensions(prefixNames: string, circularNames: string) {
    let msg1 = `Detected circular dependencies: ${circularNames}.`;
    if (prefixNames) {
      msg1 += ` It is started from ${prefixNames}.`;
    }
    return new CustomError({
      code: SystemErrorMediator.detectedCircularDependenciesForExtensions.name,
      msg1,
      level: 'fatal',
    });
  }
  /**
   * {@link extensionName1} attempted to call "extensionsManager.stage1({@link extensionName2})",
   * but {@link extensionName2} not declared in "afterExtensions" array in this module.
   */
  static notDeclaredInAfterExtensionList(extensionName1: string, extensionName2: string) {
    return new CustomError({
      code: SystemErrorMediator.notDeclaredInAfterExtensionList.name,
      msg1:
        `${extensionName1} attempted to call "extensionsManager.stage1(${extensionName2})", ` +
        `but ${extensionName2} not declared in "afterExtensions" array in this module.`,
      level: 'fatal',
    });
  }
  /**
   * `Failed to resolve imported dependencies for ${moduleName}: no provider for ${tokenName}! ${partMsg}.`
   */
  static noProviderDuringResolveImports(moduleName: string, tokenName: string, partMsg: string) {
    return new CustomError({
      code: SystemErrorMediator.noProviderDuringResolveImports.name,
      msg1: `Failed to resolve imported dependencies for ${moduleName}: no provider for ${tokenName}! ${partMsg}.`,
      level: 'fatal',
    });
  }
  /**
   * `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator`.
   */
  static rootNotHaveDecorator(rootModuleName: string) {
    return new CustomError({
      code: SystemErrorMediator.rootNotHaveDecorator.name,
      msg1: `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator.`,
      level: 'fatal',
    });
  }
  /**
   * `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`
   */
  static failAddingToImports(modName?: string, modIdStr?: string) {
    return new CustomError({
      code: SystemErrorMediator.failAddingToImports.name,
      msg1: `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`,
      level: 'warn',
    });
  }
  /**
   * `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`
   */
  static failRemovingImport(inputModName: string, modIdStr: string) {
    return new CustomError({
      code: SystemErrorMediator.failRemovingImport.name,
      msg1: `Failed removing ${inputModName} from "imports" array: target module with ID "${modIdStr}" not found.`,
      level: 'warn',
    });
  }
  /**
   * 'It is forbidden for rollback() to an empty state.'
   */
  static forbiddenRollbackEemptyState() {
    return new CustomError({
      code: SystemErrorMediator.forbiddenRollbackEemptyState.name,
      msg1: 'It is forbidden for rollback() to an empty state.',
      level: 'warn',
    });
  }
  /**
   * `${moduleId} not found in ModuleManager.`
   */
  static moduleIdNotFoundInModuleManager(moduleId: string) {
    return new CustomError({
      code: SystemErrorMediator.moduleIdNotFoundInModuleManager.name,
      msg1: `${moduleId} not found in ModuleManager.`,
      level: 'warn',
    });
  }
  /**
   * `Normalization of ${path} failed`
   */
  static normalizationFailed(path: string, err: Error) {
    return new CustomError(
      {
        code: SystemErrorMediator.normalizationFailed.name,
        msg1: `Normalization of ${path} failed`,
        level: 'fatal',
      },
      err,
    );
  }
}
