import { Module } from '@ts-stack/mod';

import { HelloWorldController } from './hello-world.controller';

@Module({
  controllers: [HelloWorldController],
  routes: [
    {
      path: 'one',
      controller: HelloWorldController,
      children: [
        {
          path: 'two',
          controller: HelloWorldController,
        },
      ],
    },
  ],
})
export class SecondModule {}
