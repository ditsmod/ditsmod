import { Provider } from '#di/types-and-models.js';
import { HttpErrorHandler } from '#error/http-error-handler.js';
import { DefaultHttpErrorHandler } from '#error/default-http-error-handler.js';

export const defaultProvidersPerRou: Provider[] = [
  { token: HttpErrorHandler, useClass: DefaultHttpErrorHandler },
];
