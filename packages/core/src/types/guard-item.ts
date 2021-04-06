import { Type } from '@ts-stack/di';

import { CanActivate } from './mix';

export type GuardItem = Type<CanActivate> | [Type<CanActivate>, any, ...any[]];
