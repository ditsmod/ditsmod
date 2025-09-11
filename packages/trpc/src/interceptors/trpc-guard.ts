import { Class, BaseMeta } from '@ditsmod/core';
import { TrpcInitMeta } from '#decorators/trpc-init-hooks-and-metadata.js';
import { TrpcOpts } from '#types/types.js';

export interface TrpcCanActivate {
  canActivate(opts: TrpcOpts, params?: any[]): boolean | Promise<boolean>;
}

export type GuardItem = Class<TrpcCanActivate> | [Class<TrpcCanActivate>, any, ...any[]];

export interface NormalizedGuard {
  guard: Class<TrpcCanActivate>;
  params?: any[];
}

export interface GuardPerMod1 extends NormalizedGuard {
  meta: TrpcInitMeta;
  baseMeta: BaseMeta;
}
