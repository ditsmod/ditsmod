import { InjectionToken } from '@ditsmod/core';
import { initTRPC } from '@trpc/server';
import { NodeHTTPRequest, NodeHTTPResponse } from '@trpc/server/adapters/node-http';

type Context = {
  req: NodeHTTPRequest;
  res: NodeHTTPResponse;
  user: {
    name: string;
  } | null;
};
export type TrcpRootObj = typeof t;
export type TrcpRouterFn = TrcpRootObj['router'];
export type TrcpProcedureFn = TrcpRootObj['procedure'];
export type TrcpMergeRoutersFn = TrcpRootObj['mergeRouters'];
export type TrcpCreateCallerFactoryFn = TrcpRootObj['createCallerFactory'];

export const t = initTRPC.context<Context>().create();
export const TRPC_ROOT = new InjectionToken<TrcpRootObj>('TRPC_ROOT');
export const TRPC_ROUTER = new InjectionToken<TrcpRouterFn>('TRPC_ROUTER');
export const TRPC_PROCEDURE = new InjectionToken<TrcpProcedureFn>('TRPC_PROCEDURE');
export const TRPC_MERGE_ROUTERS = new InjectionToken<TrcpMergeRoutersFn>('TRPC_MERGE_ROUTERS');
export const TRPC_CREATE_CALLER_FACTORY = new InjectionToken<TrcpCreateCallerFactoryFn>('TRPC_CREATE_CALLER_FACTORY');
