import { Type } from '@ts-stack/di';

import { AnyObj } from '../any-obj';

export type ModuleType<T extends AnyObj = AnyObj> = Type<T>;
