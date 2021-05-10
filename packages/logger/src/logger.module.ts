import { Logger, Module } from '@ditsmod/core';

import { Logger as DefaultLogger } from './logger';

@Module({ providersPerApp: [{ provide: Logger, useValue: DefaultLogger }] })
export class LoggerModule {}
