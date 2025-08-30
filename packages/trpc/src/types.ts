import { AnyFn, AnyObj, BaseAppOptions, InjectionToken, ModRefId } from '@ditsmod/core';
import type { AnyRouter, initTRPC } from '@trpc/server';
import type { CreateHTTPHandlerOptions } from '@trpc/server/adapters/standalone';
import type {
  NodeHTTPCreateContextFnOptions,
  NodeHTTPRequest,
  NodeHTTPResponse,
} from '@trpc/server/adapters/node-http';
import type * as http from 'node:http';
import type { Http2ServerRequest, Http2ServerResponse } from 'http2';

import type { HttpModule } from './http-module.js';
import type { ServerOptions } from './server-options.js';
import type { t } from './constants.js';

export class TrpcAppOptions extends BaseAppOptions {
  httpModule?: HttpModule | null = null;
  serverOptions?: ServerOptions = {};
}
/**
 * A DI token that allows you to obtain the instance of the server that is serving the current application.
 */
export const SERVER = new InjectionToken<http.Server>('SERVER');

export type TrpcOpts = CreateHTTPHandlerOptions<AnyRouter>;
export type TrpcCreateCtxOpts = NodeHTTPCreateContextFnOptions<NodeHTTPRequest, NodeHTTPResponse>;
export type RawRequest = http.IncomingMessage | Http2ServerRequest;
export type RawResponse = http.ServerResponse | Http2ServerResponse;
export type RequestListener = (request: RawRequest, response: RawResponse) => void | Promise<void>;
export type TrpcRootObject<T extends AnyObj> = ReturnType<ReturnType<typeof initTRPC.context<T>>['create']>;
export type SetAppRouterOptions = Omit<TrpcOpts, 'router'>;
export type RouterOptions = Parameters<typeof t.router>[0];
export interface TrpcRootModule {
  /**
   * For the root application module (AppModule), this method is automatically invoked by `@ditsmod/trpc`.
   */
  setAppRouter(): SetAppRouterOptions;
}

export interface ModuleWithTrpcRoutes<Config extends AnyObj = AnyObj> {
  getRouterConfig(): Config;
}

export type AppRouterHelper<ArrOfRouterConfig extends readonly ModRefId<ModuleWithTrpcRoutes<any>>[]> = ReturnType<
  typeof t.mergeRouters<MutableArr<ArrOfRouterConfig>>
>;
type MutableArr<ArrOfRouterConfig> = { -readonly [K in keyof ArrOfRouterConfig]: RouterOf<ArrOfRouterConfig[K]> };
type RouterOf<I> =
  I extends ModRefId<ModuleWithTrpcRoutes<infer RouterConfigOrFn>>
    ? ReturnType<typeof t.router<GetRouterConfig<RouterConfigOrFn>>>
    : never;
type GetRouterConfig<T> = {
  [K in keyof T]: T[K] extends AnyFn<any, infer R> ? CtrlOrModuleFn<R> : GetRouterConfig<T[K]>;
};
type CtrlOrModuleFn<F> = F extends AnyFn ? F : GetRouterConfig<F>;
