import { AnyObj, ctx, Status } from '@ditsmod/core';
import { controller, route, PATH_PARAMS, RequestContext } from '@ditsmod/rest';
import { getParams, getContent, oasRoute } from '@ditsmod/openapi';

import { BasicGuard } from './basic.guard.js';
import { Model2 } from './models.js';
import { getMetaContent } from './overriden-helper.js';

@controller({ providersPerReq: [BasicGuard] })
export class FirstController {
  @route(['GET', 'POST'])
  hello(reqCtx: RequestContext) {
    reqCtx.send('Hello, World!\n');
  }

  @oasRoute('GET', 'guard', [BasicGuard])
  helloWithGuard(reqCtx: RequestContext) {
    reqCtx.send('Hello, user!');
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
  getResourceId(@ctx(PATH_PARAMS) pathParams: AnyObj, reqCtx: RequestContext) {
    const { resourceId } = pathParams;
    reqCtx.sendJson({ resourceId, body: `some body for resourceId ${resourceId}` });
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
  getResourceId2(@ctx(PATH_PARAMS) pathParams: AnyObj, reqCtx: RequestContext) {
    const { resourceId } = pathParams;
    reqCtx.sendJson({ resourceId, body: `some body for resourceId ${resourceId}` });
  }
}

@controller({ scope: 'route' })
export class RouteScopedController {
  @route('GET', 'route-scoped')
  routeScoped(reqCtx: RequestContext) {
    reqCtx.send('ok');
  }
}
