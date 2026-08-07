import { rootModule } from '@holu/core';
import { SimpleExtension } from './simple-extension.js';

@rootModule({ extensions: [SimpleExtension] })
export class AppModule {}
