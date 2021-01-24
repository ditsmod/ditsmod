import { RootModule } from '@ts-stack/ditsmod';

import { SomeModule } from './modules/some/some.module';
import { AuthModule } from './modules/auth/auth.module';

@RootModule({
  imports: [AuthModule, SomeModule],
  exports: [AuthModule],
})
export class AppModule {}
