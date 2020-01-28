import { ReflectiveInjector, Provider, Injector, forwardRef } from 'ts-di';
import { Router as RestifyRouter } from '@restify-ts/router';

import { Logger, Router } from './types/types';
import { BootstrapModule } from './modules/bootstrap.module';
import { PreRequest } from './services/pre-request.service';
import { Request } from './request';
import { Response } from './response';

export const defaultProvidersPerApp: Provider[] = [
  Logger,
  { provide: Router, useClass: RestifyRouter },
  forwardRef(() => BootstrapModule),
  PreRequest,
  {
    provide: ReflectiveInjector,
    useExisting: Injector
  }
];

export const defaultProvidersPerReq: Provider[] = [Request, Response];
