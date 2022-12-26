import { controller, Req, Res } from '@ditsmod/core';
import { getParams, getContent, oasRoute } from '@ditsmod/openapi';

import { Model1, Model2 } from './models';

@controller()
export class FirstController {
  constructor(private req: Req, private res: Res) {}

  @oasRoute('GET', 'users/:username', {
    description: 'Route wtih required path parameter',
    parameters: getParams('path', true, Model1, 'username'),
  })
  getResourceId() {
    const { username } = this.req.pathParams;
    this.res.sendJson({ username });
  }

  @oasRoute('POST', 'model1', {
    description: 'Route with requestBody',
    requestBody: {
      description: 'All properties are taken from Model1.',
      content: getContent({ mediaType: 'application/json', model: Model1 }),
    },
  })
  postModel1() {
    this.res.sendJson(this.req.body);
  }

  @oasRoute('POST', 'model2', {
    description: 'Route with requestBody',
    requestBody: {
      description: 'Property model1 ref to Model1.',
      content: getContent({ mediaType: 'application/json', model: Model2 }),
    },
  })
  postModel2() {
    this.res.sendJson(this.req.body);
  }
}
