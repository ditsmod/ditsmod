import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { Http2Server, Http2ServerRequest, Http2ServerResponse, Http2SecureServer, SecureServerOptions } from 'http2';
import { Provider, InjectionToken, Type, TypeProvider, ReflectiveInjector, ResolvedReflectiveProvider } from 'ts-di';

export type RequestListener = (request: NodeRequest, response: NodeResponse) => void | Promise<void>;

export interface LoggerMethod {
  /**
   * Is the log.<level>() enabled?
   *
   * Usages:
  ```ts
  if (log.info()) {
  // info level is enabled
  }
  ```
    */
  (): boolean;
  /**
   * Log a simple string message (or number).
   */
  (msg: string | number): void;
  /**
   * Special case to log an `Error` instance to the record.
   * This adds an `err` field with exception details
   * (including the stack) and sets `msg` to the exception
   * message or you can specify the `msg`.
   */
  (error: Error, msg?: string, ...params: any[]): void;
  /**
   * The first field can optionally be a `fields` object, which
   * is merged into the log record.
   *
   * To pass in an Error *and* other fields, use the `err`
   * field name for the Error instance.
   */
  (obj: object, msg?: string, ...params: any[]): void;
  /**
   * Uses `util.format` for msg formatting.
   */
  (format: any, ...params: any[]): void;
}

export class Logger {
  trace: LoggerMethod = (...args: any[]): any => {};
  debug: LoggerMethod = (...args: any[]): any => {};
  info: LoggerMethod = (...args: any[]): any => {};
  warn: LoggerMethod = (...args: any[]): any => {};
  error: LoggerMethod = (...args: any[]): any => {};
  fatal: LoggerMethod = (...args: any[]): any => {};
}

export type NodeRequest = http.IncomingMessage | Http2ServerRequest;
export type NodeResponse = http.ServerResponse | Http2ServerResponse;
export const NodeReqToken = new InjectionToken<NodeRequest>('NodeRequest');
export const NodeResToken = new InjectionToken<NodeResponse>('NodeResponse');

/**
 * `http.METHODS`
 */
export type HttpMethod =
  | 'ACL'
  | 'BIND'
  | 'CHECKOUT'
  | 'CONNECT'
  | 'COPY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'LINK'
  | 'LOCK'
  | 'M-SEARCH'
  | 'MERGE'
  | 'MKACTIVITY'
  | 'MKCALENDAR'
  | 'MKCOL'
  | 'MOVE'
  | 'NOTIFY'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PROPFIND'
  | 'PROPPATCH'
  | 'PURGE'
  | 'PUT'
  | 'REBIND'
  | 'REPORT'
  | 'SEARCH'
  | 'SOURCE'
  | 'SUBSCRIBE'
  | 'TRACE'
  | 'UNBIND'
  | 'UNLINK'
  | 'UNLOCK'
  | 'UNSUBSCRIBE';

export type RouteHandler = () => {
  /**
   * Injector per module.
   */
  injector: ReflectiveInjector;
  /**
   * Resolved providers per request.
   */
  providers: ResolvedReflectiveProvider[];
  controller: TypeProvider;
  /**
   * Method of the class controller.
   */
  method: string;
};

export class Router {
  on(method: HttpMethod, path: string, handle: RouteHandler): this {
    return this;
  }

  all(path: string, handle: RouteHandler): this {
    return this;
  }

  find(method: HttpMethod, path: string): RouterReturns {
    return { handle: null, params: null };
  }
}

export class RouterReturns {
  handle: RouteHandler;
  params: RouteParam[];
}

export interface RouteParam {
  key: string;
  value: string;
}

export type Fn = (...args: any[]) => any;

/**
 * See also https://en.wikipedia.org/wiki/URL_redirection#HTTP_status_codes_3xx
 */
export type RedirectStatusCodes = 300 | 301 | 302 | 303 | 307 | 308;

export interface HttpServerModule {
  createServer(requestListener?: http.RequestListener): http.Server;
  createServer(options: http.ServerOptions, requestListener?: http.RequestListener): http.Server;
}

export interface HttpsServerModule {
  createServer(requestListener?: http.RequestListener): https.Server;
  createServer(options: https.ServerOptions, requestListener?: http.RequestListener): https.Server;
}

export type Http2RequestListener = (request: Http2ServerRequest, response: Http2ServerResponse) => void;

export interface Http2ServerModule {
  createServer(onRequestHandler?: Http2RequestListener): Http2Server;
  createServer(options: http2.ServerOptions, onRequestHandler?: Http2RequestListener): Http2Server;
  createSecureServer(onRequestHandler?: Http2RequestListener): Http2SecureServer;
  createSecureServer(options: SecureServerOptions, onRequestHandler?: Http2RequestListener): Http2SecureServer;
}

export type Http2SecureServerOptions = http2.SecureServerOptions & { isHttp2SecureServer: boolean };
export type ServerOptions = http.ServerOptions | https.ServerOptions | http2.ServerOptions | Http2SecureServerOptions;

export type Server = http.Server | https.Server | Http2Server | Http2SecureServer;

/**
 * It is just `{ [key: string]: any }` an object interface.
 */
export interface ObjectAny {
  [key: string]: any;
}

export type ModuleType = new (...args: any[]) => any;

export interface Route {
  path?: string;
  controller?: TypeProvider;
  redirectTo?: string;
  canActivate?: any[];
  canActivateChild?: any[];
  data?: ObjectAny;
  resolve?: ObjectAny;
  children?: this[];
}

export interface ActivatedRoute {
  routeConfig: Route | null;
  // url: UrlSegment[];
  routeParams: ObjectAny;
  queryParams: ObjectAny;
  fragment: string;
  data: ObjectAny;
  controller: Type<any> | string | null;
  root: this;
  parent: this | null;
  firstChild: this | null;
  children: this[];
  pathFromRoot: this[];
}

export interface ModuleWithProviders<T> {
  module: Type<T>;
  providers?: Provider[];
}

export type HttpModule = HttpServerModule | HttpsServerModule | Http2ServerModule;

export class ModuleMetadata {
  moduleName: string;
  imports: Type<any>[] = [];
  exports: (Type<any> | Provider)[] = [];
  providersPerMod: Provider[] = [];
  providersPerReq: Provider[] = [];
  controllers: TypeProvider[] = [];
}
