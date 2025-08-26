import { TrpcRootObject } from '@ditsmod/trpc';
import { NodeHTTPRequest, NodeHTTPResponse } from '@trpc/server/adapters/node-http';

type Context = {
  req: NodeHTTPRequest;
  res: NodeHTTPResponse;
  user: {
    name: string;
  } | null;
};
export type TrpcRootObj = TrpcRootObject<Context>;
