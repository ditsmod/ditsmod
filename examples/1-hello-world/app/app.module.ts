import { RootModule } from '@ts-stack/ditsmod';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  controllers: [HelloWorldController],
})
export class AppModule {}
