import { Controller, Response, Route } from '@ditsmod/core';

@Controller()
export class ThirdController {
  constructor(private res: Response) {}

  @Route('GET', 'get-3')
  async tellHello() {
    this.res.send('third module.\n');
  }
}
