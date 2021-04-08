import * as http from 'http';
import * as https from 'https';
import * as http2 from 'http2';
import { Http2ServerRequest, Http2ServerResponse, Http2Server, Http2SecureServer } from 'http2';
import { InjectionToken } from '@ts-stack/di';

export type Http2SecureServerOptions = http2.SecureServerOptions & { isHttp2SecureServer: boolean };
export type ServerOptions = http.ServerOptions | https.ServerOptions | http2.ServerOptions | Http2SecureServerOptions;
export type NodeRequest = http.IncomingMessage | Http2ServerRequest;
export type NodeResponse = http.ServerResponse | Http2ServerResponse;
export const NODE_REQ = new InjectionToken<NodeRequest>('NODE_REQ');
export const NODE_RES = new InjectionToken<NodeResponse>('NODE_RES');
export type RequestListener = (request: NodeRequest, response: NodeResponse) => void | Promise<void>;
export type Server = http.Server | https.Server | Http2Server | Http2SecureServer;
