import * as http from 'http';
import * as http2 from 'http2';
import { Provider, InjectionToken } from 'ts-di';

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

export class ApplicationOptions {
  serverName?: string;
  /**
   * Providers of services (aka plugins) for Dependecy Injection per an application
   */
  providersPerApp?: Provider[];
  /**
   * Providers of services (aka plugins) for Dependecy Injection per a request
   */
  providersPerReq?: Provider[];
}

export type NodeRequest = http.IncomingMessage | http2.Http2ServerRequest;
export type NodeResponse = http.ServerResponse | http2.Http2ServerResponse;
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

export class Router {
  on(method: HttpMethod, path: string, handle: Fn): this {
    return this;
  }

  all(path: string, handle: Fn): this {
    return this;
  }

  find(method: HttpMethod, path: string): RouterReturns {
    return { handle: null, params: null };
  }
}

export class RouterReturns {
  handle: Fn;
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
