import { Controller, Response, Route } from '@ditsmod/core';

@Controller()
export class SecondController {
  constructor(private res: Response) {}

  @Route('GET', 'get-2')
  async tellHello() {
    this.res.send('second module.\n');
  }
}
