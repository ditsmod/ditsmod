import { AnyObj, inject } from '@ditsmod/core';
import { HTTP_BODY } from '@ditsmod/body-parser';
import { getParams, getContent, oasRoute } from '@ditsmod/openapi';
import { controller, PATH_PARAMS, Res } from '@ditsmod/rest';

import { Model1, Model2 } from './models.js';

@controller()
export class FirstController {
  @oasRoute('GET', 'users/:username', {
    description: 'Route wtih required path parameter',
    parameters: getParams('path', true, Model1, 'username'),
  })
  getResourceId(@inject(PATH_PARAMS) pathParams: AnyObj, res: Res) {
    const { username } = pathParams;
    res.sendJson({ username });
  }

  @oasRoute('POST', 'model1', {
    description: 'Route with requestBody',
    requestBody: {
      description: 'All properties are taken from Model1.',
      content: getContent({ mediaType: 'application/json', model: Model1 }),
    },
  })
  postModel1(@inject(HTTP_BODY) body: any, res: Res) {
    res.sendJson(body);
  }

  @oasRoute('POST', 'model2', {
    description: 'Route with requestBody',
    requestBody: {
      description: 'Property model1 ref to Model1.',
      content: getContent({ mediaType: 'application/json', model: Model2 }),
    },
  })
  postModel2(@inject(HTTP_BODY) body: any, res: Res) {
    res.sendJson(body);
  }
}
