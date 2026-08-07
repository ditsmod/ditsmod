import type { Class, NormalizedModuleMeta } from '@holu/core';
import type { TrpcMixinMeta } from '#decorators/trpc-module-mixins.js';
import type { TrpcOpts } from '#types/types.js';

export interface TrpcCanActivate {
  canActivate(opts: TrpcOpts, params?: any[]): boolean | Promise<boolean>;
}

export type GuardItem = Class<TrpcCanActivate> | [Class<TrpcCanActivate>, any, ...any[]];

export interface NormalizedGuard {
  guard: Class<TrpcCanActivate>;
  params?: any[];
}

export interface ModuleScopedGuard extends NormalizedGuard {
  meta: TrpcMixinMeta;
  normalizedModuleMeta: NormalizedModuleMeta;
}
