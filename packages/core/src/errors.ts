import { diErrors } from '#di/di-errors.js';
export { cleanErrorTrace } from '#error/clean-error-trace.js';
export { ProhibitSavingModulesSnapshot, ProvidersCollision } from '#error/core-errors.js';
import { coreErrors as coreErrs } from '#error/core-errors.js';

export const coreErrors = { ...coreErrs, ...diErrors };
export type ErrorCodes = keyof typeof diErrors | keyof typeof coreErrors;
export { newCustomError } from '#error/custom-error.js';
export * from '#di/errors.js';
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
  moduleNotImportedInApplication,
  providersPerAppDoesNotIncludesTokenName,
  donotResolveCollisionForMultiProviderPerApp,
  failedCollectingMetadata,
  failedCreateInjectorPerMod,
  failedStage2,
  failedStage3,
  circularDepsInImports,
  wrongModRefId,
  moduleDoesNotHaveDecorator,
  inResolvedCollisionTokensOnly,
  moduleIsUndefined,
  reexportFailed,
  wrongExtension,
  exportingUnknownSymbol,
  forbiddenExportNormalizedProvider,
  forbiddenExportProvidersPerApp,
  moduleShouldHaveValue,
  resolvingCollisionsNotExistsOnThisLevel,
  extensionConfigCauseCyclicDeps,
  donotResolveCollisionForMultiProviderPerLevel,
  resolvingCollisionsNotImportedInApplication,
  resolvingCollisionsNotImportedInModule,
} = coreErrs;
