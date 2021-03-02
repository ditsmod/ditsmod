import { Type } from '@ts-stack/di';

import { AnyObj } from './any-obj';
import { ProvidersMetadata } from '../models/providers-metadata';
import { ModuleWithDirectives } from './module-with-directives';

export interface ModuleWithParams<T extends AnyObj> extends Partial<ProvidersMetadata>, ModuleWithDirectives {
  module: Type<T>;
}
