import { HttpBackend, HttpFrontend } from '#types/http-interceptor.js';
import { ServiceProvider } from '#types/mix.js';
import { HttpErrorHandler } from '#error/http-error-handler.js';
import { ChainMaker } from './chain-maker.js';
import { DefaultSingletonChainMaker } from './default-singleton-chain-maker.js';
import { DefaultSingletonHttpBackend } from './default-singleton-http-backend.js';
import { DefaultSingletonHttpErrorHandler } from './default-singleton-http-error-handler.js';
import { DefaultSingletonHttpFrontend } from './default-singleton-http-frontend.js';

export const defaultProvidersPerRou: ServiceProvider[] = [
  { token: HttpErrorHandler, useClass: DefaultSingletonHttpErrorHandler },
  { token: ChainMaker, useClass: DefaultSingletonChainMaker },
  { token: HttpFrontend, useClass: DefaultSingletonHttpFrontend },
  { token: HttpBackend, useClass: DefaultSingletonHttpBackend },
];
