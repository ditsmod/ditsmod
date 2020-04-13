import { RootModule } from '@ts-stack/mod';

import { HelloWorldController } from './hello-world.controller';

@RootModule({
  controllers: [HelloWorldController],
})
export class AppModule {}
