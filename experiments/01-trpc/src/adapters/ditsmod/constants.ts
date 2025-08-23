import { InjectionToken } from '@ditsmod/core';
import { AnyTRPCRouter } from '@trpc/server';
import { NodeHTTPHandlerOptions } from '@trpc/server/adapters/node-http';

export const TRPC_OPTS = new InjectionToken<NodeHTTPHandlerOptions<AnyTRPCRouter, any, any>>('TRPC_OPTS');
