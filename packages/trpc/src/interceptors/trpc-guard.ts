import { Class, BaseMeta } from '@ditsmod/core';
import { TrpcInitMeta } from '#decorators/trpc-init-hooks-and-metadata.js';
import { TrpcOpts } from '#types/constants.js';

export interface CanActivate {
  canActivate(opts: TrpcOpts, params?: any[]): boolean | Response | Promise<boolean | Response>;
}

export type GuardItem = Class<CanActivate> | [Class<CanActivate>, any, ...any[]];

export interface NormalizedGuard {
  guard: Class<CanActivate>;
  params?: any[];
}

export interface GuardPerMod1 extends NormalizedGuard {
  meta: TrpcInitMeta;
  baseMeta: BaseMeta;
}
