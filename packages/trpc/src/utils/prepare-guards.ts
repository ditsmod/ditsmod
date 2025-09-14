import { ResolvedProvider, Injector, ResolvedGuard, Class } from '@ditsmod/core';
import { inspect } from 'node:util';

import { GuardItem, NormalizedGuard } from '#interceptors/trpc-guard.js';
import { FailedValidationOfRoute } from '../error/trpc-errors.js';

export function getResolvedGuards(guards: NormalizedGuard[], resolvedProviders: ResolvedProvider[]) {
  return guards.map((g) => {
    const defaultResolvedGuard = Injector.resolve([g.guard])[0];

    const resolvedGuard: ResolvedGuard = {
      guard: resolvedProviders.concat([defaultResolvedGuard]).find((rp) => rp.dualKey.token === g.guard)!,
      params: g.params,
    };

    return resolvedGuard;
  });
}

export function normalizeGuards(guards?: GuardItem[]) {
  return (guards || []).map((item) => {
    if (Array.isArray(item)) {
      checkGuardsPerMod(item[0]);
      return { guard: item[0], params: item.slice(1) } as NormalizedGuard;
    } else {
      checkGuardsPerMod(item);
      return { guard: item } as NormalizedGuard;
    }
  });
}

export function checkGuardsPerMod(Guard: Class) {
  const type = typeof Guard?.prototype.canActivate;
  if (type != 'function') {
    const whatIsThis = inspect(Guard, false, 3).slice(0, 500);
    throw new FailedValidationOfRoute(type, whatIsThis);
  }
}
