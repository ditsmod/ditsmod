import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { BodyParserModule } from '@ditsmod/body-parser';

import { SomeModule } from './modules/routed/some/some.module';

const moduleWithBodyParserConfig = BodyParserModule.withParams({ maxBodySize: 1024 * 1024, acceptMethods: ['POST'] });

@rootModule({
  imports: [moduleWithBodyParserConfig, RouterModule],
  appends: [SomeModule],
  exports: [moduleWithBodyParserConfig],
})
export class AppModule {}
