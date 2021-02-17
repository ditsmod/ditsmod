import { Controller, Response, Route } from '@ts-stack/ditsmod';

@Controller()
export class HelloController {
  constructor(private res: Response) {}

  @Route('GET')
  tellHello() {
    this.res.send('Hello, user!\n');
  }
}
