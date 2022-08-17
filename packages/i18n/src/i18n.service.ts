import { Inject, Injectable } from '@ts-stack/di';

import { I18N_OPTIONS } from './types/mix';

@Injectable()
export class I18nextService {
  constructor(@Inject(I18N_OPTIONS) private i18next: any) {}
}
