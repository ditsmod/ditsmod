import { Controller, Res, Route } from '@ditsmod/core';

import { SomeLogMediator } from './some-log-mediator';
import { MyLogMediator } from '../../my-log-mediator';

@Controller()
export class SomeController {
  constructor(private res: Res, private myLogMediator: MyLogMediator, private someLogMediator: SomeLogMediator) {}

  @Route('GET')
  method1() {
    this.myLogMediator.newMethod(this, 'myLogMediator works');
    this.res.send(`I'm SomeController\n`);
  }

  @Route('GET', 'some')
  method2() {
    this.someLogMediator.someNewMethod(this, 'someLogMediator works');
    this.res.send(`I'm SomeController\n`);
  }
}
