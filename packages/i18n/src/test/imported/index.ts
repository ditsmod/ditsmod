import { getDictGroup } from '../../i18n-providers';
import { DictGroup } from '../../types/mix';
import { CommonDict } from '../current';
import { CommonEnDict } from './common-en.dict';
import { CommonPlDict } from './common-pl.dict';
import { CommonUkDict } from './common-uk.dict';

export const current: DictGroup[] = [getDictGroup(CommonDict, CommonEnDict, CommonUkDict, CommonPlDict)];
