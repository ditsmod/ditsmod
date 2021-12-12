import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';
import { JwtModule } from '@ditsmod/jwt';

import { AuthController } from './auth.controller';

@RootModule({
  imports: [RouterModule],
  controllers: [AuthController],
  exports: [JwtModule.withParams({ secret: 'hard-to-guess-secret' })],
})
export class AppModule {}
