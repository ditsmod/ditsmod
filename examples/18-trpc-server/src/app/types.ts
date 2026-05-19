import type { TrpcRootObject } from '@ditsmod/trpc';
import type { NodeHTTPRequest, NodeHTTPResponse } from '@trpc/server/adapters/node-http';

export type TrpcContext = {
  req: NodeHTTPRequest;
  res: NodeHTTPResponse;
  user: {
    name: string;
  } | null;
};
export type TrpcRootObj = TrpcRootObject<TrpcContext>;
export type TrpcProc = TrpcRootObj['procedure'];
