import { getDictGroup } from '#src/i18n-providers.js';
import { DictGroup } from '#types/mix.js';
import { CommonDict } from '../current/index.js';
import { CommonEnDict } from './common-en.dict.js';
import { CommonPlDict } from './common-pl.dict.js';
import { CommonUkDict } from './common-uk.dict.js';

export const current: DictGroup[] = [getDictGroup(CommonDict, CommonEnDict, CommonUkDict, CommonPlDict)];
