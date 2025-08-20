import { diErrors } from './di-errors.js';

export const {
  failedCreateFactoryProvider,
  noProvider,
  cyclicDependency,
  instantiationError,
  invalidProvider,
  noAnnotation,
  mixMultiWithRegularProviders,
  cannotFindFactoryAsMethod,
  cannotFindMethodInClass,
  settingValueByIdFailed,
  settingValueByTokenFailed,
  tokenMustBeDefined,
} = diErrors;
