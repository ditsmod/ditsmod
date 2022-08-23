import { Type } from '@ts-stack/di';

import { I18nDictionary, DictGroup } from './types/mix';

export function getDictGroup<T extends Type<I18nDictionary>>(base: T, ...dicts: T[]): DictGroup {
  return [base, ...dicts];
}