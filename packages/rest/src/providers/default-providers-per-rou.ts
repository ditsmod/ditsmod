import { Provider } from '@ditsmod/core';

import { HttpErrorHandler } from '../services/http-error-handler.js';
import { DefaultHttpErrorHandler } from '../services/default-http-error-handler.js';


export const defaultProvidersPerRou: Provider[] = [
  { token: HttpErrorHandler, useClass: DefaultHttpErrorHandler },
];
