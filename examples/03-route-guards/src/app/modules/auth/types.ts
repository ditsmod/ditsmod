import { createInjectionSymbol } from '@holu/core';

export const enum Permission {
  canActivateSomeResource = 1,
  canActivateAdministration = 2,
}

export const SESSION = createInjectionSymbol('SESSION');
