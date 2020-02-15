import { Provider, forwardRef, ReflectiveInjector, Injector } from 'ts-di';
import { Router as RestifyRouter } from '@restify-ts/router';

import { Logger, BodyParserConfig } from './types';
import { PreRequest } from '../services/pre-request';
import { ModuleFactory } from '../module-factory';
import { Request } from '../request';
import { Response } from '../response';
import { BodyParser } from '../services/body-parser';
import { EntityManager } from '../services/entity-manager';
import { EntityInjector } from '../decorators/entity';
import { Router } from './router';

export const defaultProvidersPerApp: Provider[] = [
  Logger,
  BodyParserConfig,
  { provide: Router, useClass: RestifyRouter },
  forwardRef(() => ModuleFactory),
  PreRequest,
  {
    provide: ReflectiveInjector,
    useExisting: Injector
  },
  {
    provide: EntityInjector,
    useValue: null
  }
];

export const defaultProvidersPerReq: Provider[] = [Request, Response, BodyParser, EntityManager];
