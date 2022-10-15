import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { BodyParserModule } from '@ditsmod/body-parser';

import { SomeModule } from './modules/routed/some/some.module';

const moduleWithBodyParserConfig = BodyParserModule.withParams({ maxBodySize: 1024 * 1024, acceptMethods: ['POST'] });

@RootModule({
  imports: [
    { path: '', module: SomeModule },
    moduleWithBodyParserConfig,
    RouterModule,
  ],
  exports: [moduleWithBodyParserConfig]
})
export class AppModule {}
