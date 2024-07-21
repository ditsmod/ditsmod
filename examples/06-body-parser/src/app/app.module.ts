import { rootModule } from '@ditsmod/core';
import { BodyParserModule } from '@ditsmod/body-parser';

import { SomeModule } from './modules/routed/some/some.module.js';

const moduleWithBodyParserConfig = BodyParserModule.withParams({ acceptMethods: ['POST'] });

@rootModule({
  imports: [moduleWithBodyParserConfig],
  appends: [SomeModule],
  exports: [moduleWithBodyParserConfig],
})
export class AppModule {}
