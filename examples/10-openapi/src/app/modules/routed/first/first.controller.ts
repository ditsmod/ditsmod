import { AnyObj, controller, inject, PATH_PARAMS, Res, Status } from '@ditsmod/core';
import { route } from '@ditsmod/routing';
import { getParams, getContent, oasRoute } from '@ditsmod/openapi';

import { BasicGuard } from './basic.guard.js';
import { Model2 } from './models.js';
import { getMetaContent } from './overriden-helper.js';

@controller({ providersPerReq: [BasicGuard] })
export class FirstController {
  @route(['GET', 'POST'])
  hello(res: Res) {
    res.send('Hello, World!\n');
  }

  @oasRoute('GET', 'guard', [BasicGuard])
  helloWithGuard(res: Res) {
    res.send('Hello, user!');
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
  getResourceId(@inject(PATH_PARAMS) pathParams: AnyObj, res: Res) {
    const { resourceId } = pathParams;
    res.sendJson({ resourceId, body: `some body for resourceId ${resourceId}` });
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
  getResourceId2(@inject(PATH_PARAMS) pathParams: AnyObj, res: Res) {
    const { resourceId } = pathParams;
    res.sendJson({ resourceId, body: `some body for resourceId ${resourceId}` });
  }
}

@controller({ scope: 'ctx' })
export class CtxController {
  @route('GET', 'singleton')
  singleton(res: Res) {
    res.send('ok');
  }
}
