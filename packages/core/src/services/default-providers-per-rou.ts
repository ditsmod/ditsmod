import { HttpBackend, HttpFrontend } from '#types/http-interceptor.js';
import { ServiceProvider } from '#types/mix.js';
import { ChainMaker } from './chain-maker.js';
import { HttpErrorHandler } from './http-error-handler.js';
import { DefaultSingletonChainMaker } from './default-singleton-chain-maker.js';
import { DefaultSingletonHttpBackend } from './default-singleton-http-backend.js';
import { DefaultSingletonHttpErrorHandler } from './default-singleton-http-error-handler.js';
import { SingletonHttpFrontend } from './singleton-http-frontend.js';

export const defaultProvidersPerRou: ServiceProvider[] = [
  { token: HttpErrorHandler, useClass: DefaultSingletonHttpErrorHandler },
  { token: ChainMaker, useClass: DefaultSingletonChainMaker },
  { token: HttpFrontend, useClass: SingletonHttpFrontend },
  { token: HttpBackend, useClass: DefaultSingletonHttpBackend },
];
