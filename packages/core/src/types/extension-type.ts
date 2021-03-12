import { Type } from '@ts-stack/di';

import { Extension } from './extension';

export type ExtensionType<T = any> = Type<Extension<T>>;
