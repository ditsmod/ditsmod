import { Module } from '@ditsmod/core';
import { ValidationModule } from '@ditsmod/openapi-validation';

import { FirstController } from './first.controller';

@Module({
  imports: [ValidationModule],
  controllers: [FirstController],
})
export class FirstModule {}
