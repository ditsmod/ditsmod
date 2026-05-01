import { injectable, Extension, Logger } from '@ditsmod/core';

@injectable()
export class SimpleExtension implements Extension {
  constructor(private logger: Logger) {}

  async stage1() {
    this.logger.log('info', 'Stage 1 in SimpleExtension.');
  }

  async stage2() {
    this.logger.log('info', 'Stage 2 in SimpleExtension.');
  }

  async stage3() {
    this.logger.log('info', 'Stage 3 in SimpleExtension.');
    this.logger.log('info', 'Hello World! The StandaloneApplication is a working.');
  }
}
