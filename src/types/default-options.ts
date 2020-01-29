import * as http from 'http';
import { ListenOptions } from 'net';
import { Type, Provider, TypeProvider, forwardRef, ReflectiveInjector, Injector } from 'ts-di';
import { Router as RestifyRouter } from '@restify-ts/router';

import { HttpModule, Logger, Router, ServerOptions } from './types';
import { PreRequest } from '../services/pre-request.service';
import { BootstrapModule } from '../modules/bootstrap.module';
import { Request } from '../request';
import { Response } from '../response';

export const defaultProvidersPerReq: Provider[] = [Request, Response];

export class ModuleMetadata {
  moduleName: string;
  imports: Type<any>[] = [];
  exports: (Type<any> | Provider)[] = [];
  providersPerMod: Provider[] = [];
  providersPerReq: Provider[] = defaultProvidersPerReq;
  controllers: TypeProvider[] = [];
}

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

export class ApplicationMetadata {
  serverName?: string = 'restify-ts';
  httpModule?: HttpModule = http;
  serverOptions?: ServerOptions = {};
  listenOptions?: ListenOptions = { host: 'localhost', port: 8080 };
  providersPerApp?: Provider[] = defaultProvidersPerApp;
}
