import { Providers, rootModule } from '@ditsmod/core';
import { initRest } from '@ditsmod/rest';
import { BodyParserModule } from '@ditsmod/body-parser';

import { SomeModule } from './modules/routed/some/some.module.js';

const moduleWithBodyParserConfig = BodyParserModule.withParams({
  jsonOptions: { limit: '100kb' },
  urlencodedOptions: { extended: true },
});

@initRest({ appends: [SomeModule] })
@rootModule({
  imports: [moduleWithBodyParserConfig],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
  exports: [moduleWithBodyParserConfig],
})
export class AppModule {}
