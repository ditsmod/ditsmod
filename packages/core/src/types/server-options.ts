import type * as http from 'http';
import type * as https from 'https';
import type * as http2 from 'http2';
import { Http2ServerRequest, Http2ServerResponse, Http2Server, Http2SecureServer } from 'http2';

export type Http2SecureServerOptions = http2.SecureServerOptions & { isHttp2SecureServer: boolean };
export type ServerOptions = http.ServerOptions | https.ServerOptions | http2.ServerOptions | Http2SecureServerOptions;
export type NodeRequest = http.IncomingMessage | Http2ServerRequest;
export type NodeResponse = http.ServerResponse | Http2ServerResponse;
export type RequestListener = (request: NodeRequest, response: NodeResponse) => void | Promise<void>;
export type Server = http.Server | https.Server | Http2Server | Http2SecureServer;
export type NodeServer = Server; // Alias for more unambiguous import.
