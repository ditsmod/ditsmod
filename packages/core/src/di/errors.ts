import { diErrors } from './di-errors.js';

export const {
  failedCreateFactoryProvider,
  noProviderError,
  cyclicDependencyError,
  instantiationError,
  invalidProviderError,
  noAnnotationError,
  mixMultiProvidersWithRegularProvidersError,
} = diErrors;
