import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { BodyParserModule } from '@ditsmod/body-parser';

import { SomeModule } from './modules/routed/some/some.module';

@RootModule({
  imports: [RouterModule, SomeModule, BodyParserModule]
})
export class AppModule {}
