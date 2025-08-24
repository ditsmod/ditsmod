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

export const t = initTRPC.context<Context>().create();
export const TRPC_ROOT = new InjectionToken<TrcpRootObj>('TRPC_ROOT');
