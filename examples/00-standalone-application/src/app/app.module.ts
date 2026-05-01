import { rootModule } from '@ditsmod/core';
import { SimpleExtension } from './simple-extension.js';

@rootModule({ extensions: [SimpleExtension] })
export class AppModule {}
