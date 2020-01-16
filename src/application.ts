import * as assert from 'assert-plus';
import { Provider, ReflectiveInjector, ResolvedReflectiveProvider, TypeProvider } from 'ts-di';

import {
  ApplicationOptions,
  Logger,
  NodeRequest,
  NodeResponse,
  NodeReqToken,
  NodeResToken,
  Router,
  HttpMethod,
  RequestListener
} from './types';
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
  protected router: Router;

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

  /**
   * Init providers per the application.
   */
  protected initProvidersPerApp() {
    this.providersPerApp = this.options.providersPerApp || [];
    this.providersPerApp.unshift(Logger, Router);
    this.injector = ReflectiveInjector.resolveAndCreate(this.providersPerApp);
    this.log = this.injector.get(Logger);
    this.router = this.injector.get(Router);
  }

  /**
   * Init providers per the request.
   */
  protected initProvidersPerReq() {
    this.providersPerReq = this.options.providersPerReq || [];
    this.providersPerReq.unshift(Request, Response);
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
  }

  requestListener: RequestListener = (nodeReq, nodeRes) => {
    nodeRes.setHeader('Server', this.serverName);
    const { req, res } = this.createReqRes(nodeReq, nodeRes);
    const { method, url } = nodeReq;
    const [uri, queryString] = req.decodeUrl(url).split('?');
    const { handle: handleRoute, params: routeParams } = this.router.find(method as HttpMethod, uri);
    if (!handleRoute) {
      res.sendNotFound();
      return;
    }
    req.queryParams = req.parseQueryString(queryString);
    req.routeParams = routeParams;

    handleRoute(res);
  };

  protected createReqRes(nodeReq: NodeRequest, nodeRes: NodeResponse) {
    const injector1 = this.injector.resolveAndCreateChild([
      { provide: NodeReqToken, useValue: nodeReq },
      { provide: NodeResToken, useValue: nodeRes }
    ]);
    const injector2 = injector1.createChildFromResolved(this.resolvedProvidersPerReq);
    const req = injector2.get(Request) as Request;
    const res = injector2.get(Response) as Response;

    return { req, res };
  }

  /**
   * Inserts new `Provider` at the start of `providersPerReq` array.
   */
  protected unshiftProvidersPerReq(...providers: Provider[]) {
    this.providersPerReq.unshift(...providers);
    this.resolvedProvidersPerReq = ReflectiveInjector.resolve(this.providersPerReq);
  }

  setRoute<T extends TypeProvider, K extends keyof T['prototype']>(
    method: HttpMethod,
    path: string,
    ClassController: T,
    methodOfController: K
  ) {
    this.checkController(ClassController, methodOfController);
    this.unshiftProvidersPerReq(ClassController);
    this.router.on(method, path, (res: Response) => res.callHandler(ClassController, methodOfController));

    return this;
  }

  protected checkController<T extends TypeProvider, K extends keyof Extract<T['prototype'], string>>(
    ClassController: TypeProvider,
    methodOfController: K
  ): void {
    assert.string(methodOfController as string, `In Application.checkController argument 'methodOfController'`);

    if (!ClassController || !ClassController.prototype) {
      throw new TypeError(`Invalid provider - only type of TypeProvider are allowed for a route controller`);
    }

    if (typeof ClassController.prototype[methodOfController] != 'function') {
      throw new TypeError(`Invalid method name - only method of 'classController' are allowed for a route`);
    }
  }
}
