import { injectable } from '#di';
import { ErrorMediator } from '#error/error-mediator.js';
import { CustomError } from './custom-error.js';

@injectable()
export class SystemErrorMediator extends ErrorMediator {
  /**
   * `Failed to resolve imported dependencies for ${moduleName}: no provider for ${tokenName}! ${partMsg}.`
   */
  throwNoProviderDuringResolveImports(moduleName: string, tokenName: string, partMsg: string) {
    throw new CustomError({
      code: this.throwNoProviderDuringResolveImports.name,
      msg1: `Failed to resolve imported dependencies for ${moduleName}: no provider for ${tokenName}! ${partMsg}.`,
    });
  }
  /**
   * `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator`.
   */
  rootNotHaveDecorator(rootModuleName: string) {
    return new CustomError({
      code: this.rootNotHaveDecorator.name,
      msg1: `Module scaning failed: "${rootModuleName}" does not have the "@rootModule()" decorator.`,
    });
  }
  /**
   * `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`
   */
  failAddingToImports(modName?: string, modIdStr?: string) {
    return new CustomError({
      code: this.failAddingToImports.name,
      msg1: `Failed adding ${modName} to imports: target module with ID "${modIdStr}" not found.`,
    });
  }
  /**
   * `Failed removing ${inputMeta.name} from "imports" array: target module with ID "${modIdStr}" not found.`
   */
  failRemovingImport(inputModName: string, modIdStr: string) {
    return new CustomError({
      code: this.failRemovingImport.name,
      msg1: `Failed removing ${inputModName} from "imports" array: target module with ID "${modIdStr}" not found.`,
    });
  }
  /**
   * 'It is forbidden for rollback() to an empty state.'
   */
  forbiddenRollbackEemptyState() {
    return new CustomError({
      code: this.forbiddenRollbackEemptyState.name,
      msg1: 'It is forbidden for rollback() to an empty state.',
    });
  }
  /**
   * `${moduleId} not found in ModuleManager.`
   */
  moduleIdNotFoundInModuleManager(moduleId: string) {
    return new CustomError({
      code: this.moduleIdNotFoundInModuleManager.name,
      msg1: `${moduleId} not found in ModuleManager.`,
    });
  }
  /**
   * `Normalization of ${path} failed`
   */
  normalizationFailed(path: string, err: Error) {
    return new CustomError(
      {
        code: this.normalizationFailed.name,
        msg1: `Normalization of ${path} failed`,
        level: 'fatal',
      },
      err,
    );
  }
}
