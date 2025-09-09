import { injectable } from '@ditsmod/core';

import { CtxHttpBackend } from './tokens-and-types.js';
import { TrpcRouteMeta } from '#types/trpc-route-data.js';
import { TrpcOpts } from '#types/types.js';

@injectable()
export class DefaultCtxHttpBackend implements CtxHttpBackend {
  constructor(protected routeMeta: TrpcRouteMeta) {}

  async handle(opts: TrpcOpts) {}
}
