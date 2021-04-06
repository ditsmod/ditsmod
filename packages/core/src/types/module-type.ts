import { Type } from '@ts-stack/di';

import { AnyObj } from './mix';

export type ModuleType<T extends AnyObj = AnyObj> = Type<T>;
