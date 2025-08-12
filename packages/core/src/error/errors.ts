import { SystemErrorMediator } from '#error/system-error-mediator.js';
export const {
  extensionIsFailed,
  loggerWasNotPreviouslySeted,
  detectedCircularDependenciesForExtensions,
  failAddingToImports,
  failRemovingImport,
  forbiddenRollbackEemptyState,
  moduleIdNotFoundInModuleManager,
  noProviderDuringResolveImports,
  normalizationFailed,
  notDeclaredInAfterExtensionList,
  rootNotHaveDecorator
} = SystemErrorMediator;
