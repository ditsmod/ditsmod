import { BaseAppOptions, InjectionToken } from '@ditsmod/core';
import { AnyTRPCRouter } from '@trpc/server';
import {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPHandlerOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from '@trpc/server/adapters/node-http';
import type * as http from 'node:http';
import { Http2ServerRequest, Http2ServerResponse } from 'http2';

import { HttpModule } from './http-module.js';
import { ServerOptions } from './server-options.js';

export class TrpcAppOptions extends BaseAppOptions {

  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
}
/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<http.Server>('SERVER');


export type TrcpOpts = NodeHTTPHandlerOptions<AnyTRPCRouter, NodeHTTPRequest, NodeHTTPResponse>;
export type TrcpCreateCtxOpts = NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>;
export type RawRequest = http.IncomingMessage | Http2ServerRequest;
export type RawResponse = http.ServerResponse | Http2ServerResponse;
export type RequestListener = (request: RawRequest, response: RawResponse) => void | Promise<void>;
