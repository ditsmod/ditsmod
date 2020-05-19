import { Controller, Response, Route } from '@ts-stack/mod';

@Controller()
export class HelloWorldController {
  constructor(private res: Response) {}

  @Route('GET')
  tellHello() {
    this.res.send('Hello World (v2)!\n');
  }
}
