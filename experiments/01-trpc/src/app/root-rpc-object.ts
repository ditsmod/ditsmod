import { initTRPC } from '@trpc/server';
import { NodeHTTPRequest, NodeHTTPResponse } from '@trpc/server/adapters/node-http';

type Context = {
  req: NodeHTTPRequest;
  res: NodeHTTPResponse;
  user: {
    name: string;
  } | null;
};
export type TrcpRootObj = ReturnType<ReturnType<typeof initTRPC.context<Context>>['create']>
