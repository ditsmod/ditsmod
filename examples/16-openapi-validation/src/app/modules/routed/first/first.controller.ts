import { AnyObj, ctx } from '@holu/core';
import { HTTP_BODY } from '@holu/body-parser';
import { getParams, getContent, oasRoute } from '@holu/openapi';
import { controller, PATH_PARAMS, RequestContext } from '@holu/rest';

import { Model1, Model2 } from './models.js';

@controller()
export class FirstController {
  @oasRoute('GET', 'users/:username', {
    description: 'Route wtih required path parameter',
    parameters: getParams('path', true, Model1, 'username'),
  })
  getResourceId(@ctx(PATH_PARAMS) pathParams: AnyObj, ctx: RequestContext) {
    const { username } = pathParams;
    ctx.sendJson({ username });
  }

  @oasRoute('POST', 'model1', {
    description: 'Route with requestBody',
    requestBody: {
      description: 'All properties are taken from Model1.',
      content: getContent({ mediaType: 'application/json', model: Model1 }),
    },
  })
  postModel1(@ctx(HTTP_BODY) body: any, ctx: RequestContext) {
    ctx.sendJson(body);
  }

  @oasRoute('POST', 'model2', {
    description: 'Route with requestBody',
    requestBody: {
      description: 'Property model1 ref to Model1.',
      content: getContent({ mediaType: 'application/json', model: Model2 }),
    },
  })
  postModel2(@ctx(HTTP_BODY) body: any, ctx: RequestContext) {
    ctx.sendJson(body);
  }
}
