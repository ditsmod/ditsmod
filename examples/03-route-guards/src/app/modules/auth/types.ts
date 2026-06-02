import { getSymbol } from '@ditsmod/core';

export const enum Permission {
  canActivateSomeResource = 1,
  canActivateAdministration = 2,
}

export const SESSION = getSymbol('SESSION');
