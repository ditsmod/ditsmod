import { Request } from '../../../src/request';
import { Response } from '../../../src/response';
import { Controller, Route } from '../../../src/decorators';

@Controller({ path: 'another' })
export class ParamsController {
  constructor(private req: Request, private res: Response) {}

  @Route('GET', ':param1/:param2')
  getParams() {
    this.res.send(`Response with params: ${JSON.stringify(this.req.routeParams)}`);
  }
}
