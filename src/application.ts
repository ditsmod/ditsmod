import * as assert from 'assert-plus';
import { Provider, ReflectiveInjector, ResolvedReflectiveProvider } from 'ts-di';

import { ApplicationOptions, Logger, NodeRequest, NodeResponse, NodeReqToken, NodeResToken } from './types';
import { Request } from './request';
import { Response } from './response';

export class Application {
  log: Logger;
  injector: ReflectiveInjector;
  protected readonly options: ApplicationOptions;
  protected serverName: string;
  protected providersPerApp?: Provider[];
  protected providersPerReq?: Provider[];
  protected resolvedProvidersPerReq: ResolvedReflectiveProvider[];

  constructor(options?: ApplicationOptions) {
    assert.optionalObject(options, 'options');
    if (Array.isArray(options)) {
      throw new TypeError('Invalid server options - only object are allowed, got: array');
    }
    this.options = options = { ...options };

    assert.optionalString(options.serverName, 'options.serverName');
    this.serverName = options.serverName || 'restify-ts';

    assert.optionalArray(options.providersPerApp, 'options.providersPerApp');
    assert.optionalArray(options.providersPerReq, 'options.providersPerReq');
    this.initProvidersPerApp();
    this.initProvidersPerReq();
  }

  protected initProvidersPerApp() {
    this.providersPerApp = this.options.providersPerApp || [];
    this.providersPerApp.unshift(Logger);
    this.injector = ReflectiveInjector.resolveAndCreate(this.providersPerApp);
    this.log = this.injector.get(Logger);
  }

  protected initProvidersPerReq() {
    this.providersPerReq = this.options.providersPerReq || [];
    this.providersPerReq.unshift(Request, Response);
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
  }

  requestListener = (nodeReq: NodeRequest, nodeRes: NodeResponse) => {
    const { req, res } = this.createReqRes(nodeReq, nodeRes);

    nodeRes.setHeader('Server', this.serverName);
    res.send('Hello World!');
  };

  protected createReqRes(nodeReq: NodeRequest, nodeRes: NodeResponse) {
    const injector1 = this.injector.resolveAndCreateChild([
      { provide: NodeReqToken, useValue: nodeReq },
      { provide: NodeResToken, useValue: nodeRes }
    ]);
    const injector2 = injector1.createChildFromResolved(this.resolvedProvidersPerReq);
    const req = injector2.get(Request);
    const res = injector2.get(Response);

    return { req, res };
  }
}
