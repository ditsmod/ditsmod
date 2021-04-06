import { AnyObj } from './mix';
import { ModuleType } from './module-type';
import { NormalizedGuard } from './normalized-guard';

export interface NormalizedImport<T extends ModuleType<AnyObj> = ModuleType<AnyObj>> {
  prefix: string;
  module: T;
  guards: NormalizedGuard[];
  [key: string]: any;
}
