import { AnyObj } from './any-obj';
import { ModuleType } from './module-type';
import { NormalizedGuard } from './normalized-guard';

export interface NormalizedImport<T extends ModuleType<AnyObj> = ModuleType<AnyObj>> {
  prefix: string;
  module: ModuleType<T>;
  guards: NormalizedGuard[];
  [key: string]: any;
}
