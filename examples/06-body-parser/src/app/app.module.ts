import { LoggerConfig, ProviderBuilder } from '@ditsmod/core';
import { restRootModule } from '@ditsmod/rest';
import { BodyParserModule } from '@ditsmod/body-parser';

import { SomeModule } from './modules/routed/some.module.js';

const moduleWithBodyParserConfig = BodyParserModule.withOpts({
  jsonOptions: { limit: '100kb' },
  urlencodedOptions: { extended: true },
});

@restRootModule({
  appends: [SomeModule],
  imports: [moduleWithBodyParserConfig],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'info' }),
  exports: [moduleWithBodyParserConfig],
})
export class AppModule {}
