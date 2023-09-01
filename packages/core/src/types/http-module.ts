import * as http from 'http';
import * as http2 from 'http2';
import { Http2SecureServer, Http2Server, Http2ServerRequest, Http2ServerResponse, SecureServerOptions } from 'http2';
import * as https from 'https';

export type HttpModule = HttpServerModule | HttpsServerModule | Http2ServerModule;

export interface HttpServerModule {
  createServer(requestListener?: http.RequestListener): http.Server;
  createServer(options: http.ServerOptions, requestListener?: http.RequestListener): http.Server;
}

export interface HttpsServerModule {
  createServer(requestListener?: http.RequestListener): https.Server;
  createServer(options: https.ServerOptions, requestListener?: http.RequestListener): https.Server;
}

export interface Http2ServerModule {
  createServer(onRequestHandler?: Http2RequestListener): Http2Server;
  createServer(options: http2.ServerOptions, onRequestHandler?: Http2RequestListener): Http2Server;
  createSecureServer(onRequestHandler?: Http2RequestListener): Http2SecureServer;
  createSecureServer(options: SecureServerOptions, onRequestHandler?: Http2RequestListener): Http2SecureServer;
}

export type Http2RequestListener = (request: Http2ServerRequest, response: Http2ServerResponse) => void;
