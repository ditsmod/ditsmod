import { HttpBackend, HttpFrontend } from '#types/http-interceptor.js';
import { Provider } from '#types/mix.js';
import { HttpErrorHandler } from '#error/http-error-handler.js';
import { DefaultSingletonHttpErrorHandler } from '#error/default-singleton-http-error-handler.js';
import { ChainMaker } from './chain-maker.js';
import { DefaultSingletonChainMaker } from './default-singleton-chain-maker.js';
import { DefaultSingletonHttpBackend } from '../interceptors/default-singleton-http-backend.js';
import { DefaultSingletonHttpFrontend } from '../interceptors/default-singleton-http-frontend.js';

export const defaultProvidersPerRou: Provider[] = [
  { token: HttpErrorHandler, useClass: DefaultSingletonHttpErrorHandler },
  { token: ChainMaker, useClass: DefaultSingletonChainMaker },
  { token: HttpFrontend, useClass: DefaultSingletonHttpFrontend },
  { token: HttpBackend, useClass: DefaultSingletonHttpBackend },
];
