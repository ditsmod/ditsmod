import * as assert from 'assert-plus';
import { ReflectiveInjector, Provider } from 'ts-di';

import { RequestListener, ApplicationOptions, Logger } from './types';

export class Application {
  log: Logger;
  injector: ReflectiveInjector;
  protected readonly options: ApplicationOptions;
  protected serverName: string;
  protected providersPerApp?: Provider[];

  constructor(options?: ApplicationOptions) {
    assert.optionalObject(options, 'options');
    if (Array.isArray(options)) {
      throw new TypeError('Invalid server options - only object are allowed, got: array');
    }
    this.options = options = { ...options };

    assert.optionalString(options.serverName, 'options.serverName');
    this.serverName = options.serverName || 'restify-ts';

    assert.optionalArray(options.providersPerApp, 'options.providersPerApp');
    this.initProvidersPerApp();
  }

  protected initProvidersPerApp() {
    this.providersPerApp = this.options.providersPerApp || [];
    this.providersPerApp.unshift({ provide: Logger, useValue: new Logger() });
    this.injector = ReflectiveInjector.resolveAndCreate(this.providersPerApp);
    this.log = this.injector.get(Logger);
  }

  requestListener: RequestListener = (request, response) => {
    response.setHeader('server', this.serverName);
    response.end('Hello World!');
  };
}
