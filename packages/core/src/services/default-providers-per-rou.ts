import { HttpBackend, HttpFrontend } from '#types/http-interceptor.js';
import { ServiceProvider } from '#types/mix.js';
import { ChainMaker } from './chain-maker.js';
import { HttpErrorHandler } from './http-error-handler.js';
import { SingletonChainMaker } from './singleton-chain-maker.js';
import { SingletonHttpBackend } from './singleton-http-backend.js';
import { SingletonHttpErrorHandler } from './singleton-http-error-handler.js';
import { SingletonHttpFrontend } from './singleton-http-frontend.js';

export const defaultProvidersPerRou: ServiceProvider[] = [
  { token: HttpErrorHandler, useClass: SingletonHttpErrorHandler },
  { token: ChainMaker, useClass: SingletonChainMaker },
  { token: HttpFrontend, useClass: SingletonHttpFrontend },
  { token: HttpBackend, useClass: SingletonHttpBackend },
];
