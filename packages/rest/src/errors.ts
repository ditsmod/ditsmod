import { restErrors } from '#services/router-errors.js';

export const {
  checkingDepsInSandboxFailed,
  invalidInterceptor,
  catchAllConflictWithExistingHandle,
  catchAllRoutesOnlyAtEnd,
  conflictsWithExistingWildcard,
  handleAlreadyRegistered,
  invalidNodeType,
  noBeforeCatchAll,
  onlyOneWildcardPerPath,
  wildcardRouteConflicts,
  wildcardsMustNonEmpty,
  moduleMustHaveControllers,
  moduleIncludesInImportsAndAppends,
} = restErrors;
