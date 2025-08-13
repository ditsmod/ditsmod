import { systemErrors } from '#error/system-errors.js';
export { newCustomError } from '#error/custom-error.js';

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
  rootNotHaveDecorator,
} = systemErrors;
