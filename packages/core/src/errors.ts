import { diErrors } from '#di/di-errors.js';
export { ProhibitSavingModulesSnapshot, ProvidersCollision } from '#error/core-errors.js';
import { coreErrors as coreErrs } from '#error/core-errors.js';

export const coreErrors = { ...coreErrs, ...diErrors };
export * from '#di/errors.js';
export const {
  extensionFailed,
  loggerNotSet,
  circularDepsBetweenExtensions,
  failAddingToImports,
  failRemovingImport,
  forbiddenRollbackEmptyState,
  moduleIdNotFoundInModuleManager,
  noProviderDuringResolveImports,
  normalizationFailed,
  notDeclaredInAfterExtensionList,
  rootNotHaveDecorator,
  moduleNotImportedInApplication,
  providersPerAppMissingTokenName,
  cannotResolveCollisionForMultiProviderPerApp,
  failedCollectingMetadata,
  failedCreateInjectorPerMod,
  failedStage2,
  failedStage3,
  circularDepsInImports,
  invalidModRefId,
  moduleDoesNotHaveDecorator,
  resolvedCollisionTokensOnly,
  undefinedModule,
  reexportFailed,
  wrongExtension,
  exportingUnknownSymbol,
  forbiddenExportNormalizedProvider,
  forbiddenExportProvidersPerApp,
  moduleShouldHaveValue,
  resolvingCollisionsNotExistsOnThisLevel,
  extensionConfigCauseCyclicDeps,
  cannotResolveCollisionForMultiProviderPerLevel,
  resolvingCollisionsNotImportedInApplication,
  resolvingCollisionsNotImportedInModule,
} = coreErrs;
