import { rootModule } from '@ditsmod/core';
import { Module1 } from './module1/module1.js';

@rootModule({ imports: [Module1] })
export class AppModule {}
