import { diErrors } from '#di/di-errors.js';
import { systemErrors } from '#error/system-errors.js';

export type ErrorCodes = keyof typeof diErrors | keyof typeof systemErrors;
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
  multiProviderShouldNotBIncludedInResolvedCollisionsPerApp,
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
  tryResolvingMultiprovidersCollisions,
  resolvingCollisionsNotImportedInApplication,
  resolvingCollisionsNotImportedInModule,
} = systemErrors;
