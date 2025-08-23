import { rootModule } from '@ditsmod/core';

import { Module1 } from './module1/module1.js';
import { PreRouter } from '../adapters/ditsmod/pre-router.js';

@rootModule({ providersPerApp: [PreRouter], imports: [Module1] })
export class AppModule {}
