import { controller, Req, Res, route, Status } from '@ditsmod/core';
import { getParams, getContent, oasRoute } from '@ditsmod/openapi';

import { BasicGuard } from './basic.guard';
import { Model2 } from './models';
import { getMetaContent } from './overriden-helper';

@controller({ providersPerReq: [BasicGuard] })
export class FirstController {
  constructor(private req: Req, private res: Res) {}

  @route('GET')
  hello() {
    this.res.send('Hello World!\n');
  }

  @oasRoute('GET', 'guard', [BasicGuard])
  helloWithGuard() {
    this.res.send('Hello, user!');
  }

  @oasRoute('GET', 'resource/:resourceId', {
    tags: ['withParameter'],
    description: 'This route uses `getParams()` and `getContent()` helpers from @ditsmod/openapi',
    parameters: getParams('path', true, Model2, 'resourceId'),
    responses: {
      [Status.OK]: {
        description: 'Single item',
        content: getContent({ mediaType: 'application/json', model: Model2 }),
      },
    },
  })
  getResourceId() {
    const { resourceId } = this.req.pathParams;
    this.res.sendJson({ resourceId, body: `some body for resourceId ${resourceId}` });
  }

  @oasRoute('GET', 'resource2/:resourceId', {
    tags: ['withParameter'],
    description: 'This route like previous, but uses template `{ data: Model1[], meta: any, error: any }`',
    parameters: getParams('path', true, Model2, 'resourceId'),
    responses: {
      [Status.OK]: {
        description: 'Single item',
        content: getMetaContent({ mediaType: 'application/json', model: Model2 }),
      },
    },
  })
  getResourceId2() {
    const { resourceId } = this.req.pathParams;
    this.res.sendJson({ resourceId, body: `some body for resourceId ${resourceId}` });
  }
}
