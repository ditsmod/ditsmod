import { Type } from '@ts-stack/di';

import { CanActivate } from './mix';

export interface NormalizedGuard {
  guard: Type<CanActivate>;
  params?: any[];
}
