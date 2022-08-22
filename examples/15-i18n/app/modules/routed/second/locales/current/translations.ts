import { TranslationGroup } from '@ditsmod/i18n';

import { CommonDict } from './en/common.dict';
import { CommonUkDict } from './uk/common-uk.dict';
import { ErrorsDict } from './en/errors.dict';
import { ErrorsUkDict } from './uk/errors-uk.dict';

export const currentTranslations: TranslationGroup[] = [
  [CommonDict, CommonUkDict],
  [ErrorsDict, ErrorsUkDict],
];
