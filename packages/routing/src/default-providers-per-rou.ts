import { Provider } from '@ditsmod/core';

import { HttpErrorHandler } from './http-error-handler.js';
import { DefaultHttpErrorHandler } from './default-http-error-handler.js';


export const defaultProvidersPerRou: Provider[] = [
  { token: HttpErrorHandler, useClass: DefaultHttpErrorHandler },
];
