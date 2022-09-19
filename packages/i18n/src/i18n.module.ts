import { Module, PRE_ROUTER_EXTENSIONS } from '@ditsmod/core';

import { I18nExtension } from './i18n.extension';
import { I18N_EXTENSIONS } from './types/mix';

@Module({
  extensions: [
    { extension: I18nExtension, groupToken: I18N_EXTENSIONS, nextToken: PRE_ROUTER_EXTENSIONS, exported: true },
  ]
})
export class I18nModule {}
