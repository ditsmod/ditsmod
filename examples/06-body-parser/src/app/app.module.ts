import { Providers } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';
import { BodyParserModule } from '@ditsmod/body-parser';

import { SomeModule } from './modules/routed/some.module.js';

const moduleWithBodyParserConfig = BodyParserModule.withParams({
  jsonOptions: { limit: '100kb' },
  urlencodedOptions: { extended: true },
});

@restRootModule({
  appends: [SomeModule],
  imports: [moduleWithBodyParserConfig],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  exports: [moduleWithBodyParserConfig],
})
export class AppModule {}
