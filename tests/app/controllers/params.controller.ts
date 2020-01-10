import { Injectable } from 'ts-di';

import { Request } from '../../../src/request';
import { Response } from '../../../src/response';

@Injectable()
export class ParamsController {
  constructor(private req: Request, private res: Response) {}

  getParams() {
    this.res.send(`Response with params: ${JSON.stringify(this.req.params)}`);
  }
}
