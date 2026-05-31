import type { Class, BaseMeta, Context } from '@ditsmod/core';
import { Reflector } from '@ditsmod/core';
import type { RestInitMeta } from '#init/rest-init-meta.js';

export const guard = Reflector.makeClassDecorator((data?: never) => data);

export interface CanActivate {
  canActivate(ctx: Context, params?: any[]): boolean | Response | Promise<boolean | Response>;
}

export type GuardItem = Class<CanActivate> | [Class<CanActivate>, any, ...any[]];

export interface NormalizedGuard {
  guard: Class<CanActivate>;
  params?: any[];
}

export interface GuardPerMod1 extends NormalizedGuard {
  meta: RestInitMeta;
  baseMeta: BaseMeta;
}
