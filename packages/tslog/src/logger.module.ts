import { Logger, Module } from '@ditsmod/core';

import { TslogService } from './tslog.service';

@Module({ providersPerApp: [{ provide: Logger, useValue: TslogService }] })
export class TslogModule {}
