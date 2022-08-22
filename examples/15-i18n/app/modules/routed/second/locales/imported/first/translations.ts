import { TranslationGroup } from '@ditsmod/i18n';

import { CommonDict } from '../../../../../service/first/locales/current/en/common.dict';
import { CommonEnDict } from './en/common-en.dict';
import { CommonUkDict } from './uk/common-uk.dict';

export const importedTranslations: TranslationGroup[] = [
  [CommonDict, CommonEnDict, CommonUkDict],
];
