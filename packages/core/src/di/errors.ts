import { diErrors } from './di-errors.js';
export { NoProvider, InstantiationError } from './di-errors.js';

export const {
  failedCreateFactoryProvider,
  cyclicDependency,
  invalidProvider,
  noAnnotation,
  mixMultiWithRegularProviders,
  cannotFindFactoryAsMethod,
  cannotFindMethodInClass,
  settingValueByIdFailed,
  settingValueByTokenFailed,
  tokenMustBeDefined,
} = diErrors;
