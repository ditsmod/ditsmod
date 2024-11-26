import type * as http from 'http';
import type * as http2 from 'http2';
import { Http2SecureServer, Http2Server, Http2ServerRequest, Http2ServerResponse } from 'http2';
import type * as https from 'https';

export type Http2SecureServerOptions = http2.SecureServerOptions & { isHttp2SecureServer: boolean };
export type ServerOptions = http.ServerOptions | https.ServerOptions | http2.ServerOptions | Http2SecureServerOptions;
export type RawRequest = http.IncomingMessage | Http2ServerRequest;
export type RawResponse = http.ServerResponse | Http2ServerResponse;
export type RequestListener = (request: RawRequest, response: RawResponse) => void | Promise<void>;
export type Server = http.Server | https.Server | Http2Server | Http2SecureServer;
export type HttpServer = Server; // Alias for more unambiguous import.
