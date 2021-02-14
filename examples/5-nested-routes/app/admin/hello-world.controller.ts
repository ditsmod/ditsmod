import { Controller, Response, Route } from '@ts-stack/ditsmod';

@Controller()
export class HelloWorldController {
  constructor(private res: Response) {}

  @Route('GET')
  tellHello() {
    this.res.send('Hello World (admin)!\n');
  }
}
