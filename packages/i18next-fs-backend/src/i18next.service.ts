import { Inject, Injectable } from '@ts-stack/di';
import { i18n } from 'i18next';

import { I18NEXT_FS_BACKEND_OPTIONS } from './types/mix';

@Injectable()
export class I18nextService {
  constructor(@Inject(I18NEXT_FS_BACKEND_OPTIONS) private i18next: i18n) {}
}
