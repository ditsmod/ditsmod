import type { Injector } from '@ditsmod/core';
import { TrpcRootObject } from '@ditsmod/trpc';
import { NodeHTTPRequest, NodeHTTPResponse } from '@trpc/server/adapters/node-http';

type Context = {
  req: NodeHTTPRequest;
  res: NodeHTTPResponse;
  user: {
    name: string;
  } | null;
  injectorPerRou: Injector;
  injectorPerReq: Injector;
};
export type TrpcRootObj = TrpcRootObject<Context>;
export type TrpcProc = TrpcRootObj['procedure'];
