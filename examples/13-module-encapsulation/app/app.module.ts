import { RootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { AppController } from './app.controller';
import { ThreeModule } from './three/three.module';


@RootModule({
  imports: [RouterModule, ThreeModule],
  controllers: [AppController],
})
export class AppModule {}
