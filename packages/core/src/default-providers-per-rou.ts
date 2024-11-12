import { HttpFrontend } from '#interceptors/tokens-and-types.js';
import { Provider } from '#types/mix.js';
import { HttpErrorHandler } from '#error/http-error-handler.js';
import { DefaultHttpErrorHandler } from '#error/default-http-error-handler.js';
import { DefaultSingletonHttpFrontend } from './interceptors/default-singleton-http-frontend.js';

export const defaultProvidersPerRou: Provider[] = [
  { token: HttpErrorHandler, useClass: DefaultHttpErrorHandler },
  { token: HttpFrontend, useClass: DefaultSingletonHttpFrontend },
];
