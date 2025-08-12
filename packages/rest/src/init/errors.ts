import { RestErrorMediator } from '#services/router-error-mediator.js';

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
} = RestErrorMediator;
