import { injectable } from '@ditsmod/core';

import { SomeLogMediator } from './some-log-mediator.js';

@injectable()
export class SomeService {
  constructor(private someLogMediator: SomeLogMediator) {}

  setSomeLog() {
    this.someLogMediator.someNewMethod(this, 'writen by setSomeLog()');
  }
}
