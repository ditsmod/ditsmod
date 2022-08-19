import { Inject, Injectable } from '@ts-stack/di';

import { I18nOptions } from './types/mix';

@Injectable()
export class I18nextService {
  constructor(@Inject(I18nOptions) private i18next: any) {}
}
