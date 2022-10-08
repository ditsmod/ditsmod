import { Controller, Res, Route } from '@ditsmod/core';

@Controller()
export class FirstController {
  constructor(private res: Res) {}

  @Route('GET')
  getMethod() {
    this.res.send('GET method\n');
  }

  @Route('POST')
  postMethod() {
    this.res.send('POST method\n');
  }

  @Route('PATCH')
  patchMethod() {
    this.res.send('PATCH method\n');
  }
}

@Controller()
export class SecondController {
  constructor(private res: Res) {}

  @Route('PUT', '')
  puthMethod() {
    this.res.send('PUT method\n');
  }
}
