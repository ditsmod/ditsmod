import { Injectable } from '@ts-stack/di';

import { SomeLogMediator } from './some-log-mediator';

@Injectable()
export class SomeService {
  constructor(private someLogMediator: SomeLogMediator) {}

  setSomeLog() {
    this.someLogMediator.someNewMethod(this, 'writen by setSomeLog()');
  }
}
