import { HttpBackend, HttpFrontend } from '#types/http-interceptor.js';
import { Provider } from '#types/mix.js';
import { HttpErrorHandler } from '#error/http-error-handler.js';
import { DefaultHttpErrorHandler } from '#error/default-http-error-handler.js';
import { ChainMaker } from './services/chain-maker.js';
import { DefaultSingletonChainMaker } from './services/default-singleton-chain-maker.js';
import { DefaultSingletonHttpBackend } from './interceptors/default-singleton-http-backend.js';
import { DefaultSingletonHttpFrontend } from './interceptors/default-singleton-http-frontend.js';

export const defaultProvidersPerRou: Provider[] = [
  { token: HttpErrorHandler, useClass: DefaultHttpErrorHandler },
  { token: ChainMaker, useClass: DefaultSingletonChainMaker },
  { token: HttpFrontend, useClass: DefaultSingletonHttpFrontend },
  { token: HttpBackend, useClass: DefaultSingletonHttpBackend },
];
