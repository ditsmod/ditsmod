import { Controller, Response, Route, ORM } from '@ts-stack/mod';

@Controller()
export class HelloWorldController {
  constructor(private res: Response, private mysqlDriver: ORM.MysqlDriver) {}

  @Route('GET')
  tellHello() {
    this.res.send('Hello World!\n');
  }
}
