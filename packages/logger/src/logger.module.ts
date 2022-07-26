import { Logger, Module } from '@ditsmod/core';

import { TsLogService } from './ts-log.service';

@Module({ providersPerApp: [{ provide: Logger, useValue: TsLogService }] })
export class LoggerModule {}
