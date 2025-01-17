import { Class, makeClassDecorator, NormalizedModuleMetadata } from '@ditsmod/core';
import { RequestContext } from '#services/request-context.js';
import { RoutingNormalizedModuleMetadata } from '#types/routing-normalized-module-metadata.js';

export const guard = makeClassDecorator((data?: never) => data);

export interface CanActivate {
  canActivate(ctx: RequestContext, params?: any[]): boolean | Response | Promise<boolean | Response>;
}

export type GuardItem = Class<CanActivate> | [Class<CanActivate>, any, ...any[]];

export interface NormalizedGuard {
  guard: Class<CanActivate>;
  params?: any[];
}

export interface GuardPerMod1 extends NormalizedGuard {
  meta: RoutingNormalizedModuleMetadata & NormalizedModuleMetadata;
}
