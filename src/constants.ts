import { ReflectiveInjector, Provider, Injector, forwardRef } from 'ts-di';

import { Logger, Router } from './types/types';
import { BootstrapModule } from './modules/bootstrap.module';
import { PreRequest } from './pre-request.service';
import { Request } from './request';
import { Response } from './response';

export const defaultProvidersPerApp: Provider[] = [
  Logger,
  Router,
  forwardRef(() => BootstrapModule),
  PreRequest,
  {
    provide: ReflectiveInjector,
    useExisting: Injector
  }
];

export const defaultProvidersPerReq: Provider[] = [Request, Response];
