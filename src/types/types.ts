import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { Http2Server, Http2ServerRequest, Http2ServerResponse, Http2SecureServer, SecureServerOptions } from 'http2';
import { Provider, Type } from 'ts-di';
import { HttpMethod } from './router';

export type RequestListener = (request: NodeRequest, response: NodeResponse) => void | Promise<void>;

export type NodeRequest = http.IncomingMessage | Http2ServerRequest;
export type NodeResponse = http.ServerResponse | Http2ServerResponse;

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

export interface ModuleWithProviders<T> {
  module: Type<T>;
  providers?: Provider[];
}

export type HttpModule = HttpServerModule | HttpsServerModule | Http2ServerModule;

export class BodyParserConfig {
  acceptMethods: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
}

export type FormattersFn = (body?: any) => string | Buffer | Uint8Array;
export type FormattersMap = Map<string, FormattersFn>;
