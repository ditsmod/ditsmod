import { TranslationGroup } from '@ditsmod/i18n';

import { Common } from '../../../../../service/first/locales/current/en/common';
import { CommonEn } from './en/common';
import { CommonUk } from './uk/common';

export const importedTranslations: TranslationGroup[] = [
  [Common, CommonEn, CommonUk],
];
