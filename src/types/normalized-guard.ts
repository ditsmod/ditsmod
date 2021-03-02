import { Type } from '@ts-stack/di';

import { CanActivate } from './can-activate';

export interface NormalizedGuard {
  guard: Type<CanActivate>;
  params?: any[];
}
