import { Controller, Req, Res } from '@ditsmod/core';
import { getParams, getContent, OasRoute } from '@ditsmod/openapi';

import { Model1 } from './models';

@Controller()
export class FirstController {
  constructor(private req: Req, private res: Res) {}

  @OasRoute('GET', 'resource/:resourceId', {
    description: 'Route wtih required path parameter',
    parameters: getParams('path', true, Model1, 'resourceId'),
  })
  getResourceId() {
    const { resourceId } = this.req.pathParams;
    this.res.sendJson({ resourceId });
  }

  @OasRoute('POST', 'resource', {
    description: 'Route with requestBody',
    requestBody: {
      description: 'All properties are taken from Model1.',
      content: getContent({ mediaType: 'application/json', model: Model1 }),
    },
  })
  postResourceId() {
    this.res.sendJson(this.req.body);
  }
}
