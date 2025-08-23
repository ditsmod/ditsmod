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
export const t = initTRPC.context<Context>().create();
export type TrcpRootType = typeof t;
export const TRPC_ROOT = new InjectionToken<TrcpRootType>('TRPC_ROOT');
export type TrcpRouterFn = TrcpRootType['router'];
export const TRPC_ROUTER = new InjectionToken<TrcpRouterFn>('TRPC_ROUTER');
export type TrcpProcedureFn = TrcpRootType['procedure'];
export const TRPC_PROCEDURE = new InjectionToken<TrcpProcedureFn>('TRPC_PROCEDURE');
export type TrcpMergeRoutersFn = TrcpRootType['mergeRouters'];
export const TRPC_MERGE_ROUTERS = new InjectionToken<TrcpMergeRoutersFn>('TRPC_MERGE_ROUTERS');
export type TrcpCreateCallerFactoryFn = TrcpRootType['createCallerFactory'];
export const TRPC_CREATE_CALLER_FACTORY = new InjectionToken<TrcpCreateCallerFactoryFn>('TRPC_CREATE_CALLER_FACTORY');
