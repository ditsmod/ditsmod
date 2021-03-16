import { Module } from '@ditsmod/core';

import { ThirdController } from './third.controller';

@Module({ controllers: [ThirdController] })
export class ThirdModule {}
