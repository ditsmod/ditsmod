import { AnyObj, controller, inject, PATH_PARAMS, Res, route } from '@ditsmod/core';

@controller()
export class CommentsController {
  /**
   * As you seen, you can apply multi `@route` statement to a single method.
   */
  @route('GET')
  @route('GET', ':commentId')
  sendComments(@inject(PATH_PARAMS) pathParams: AnyObj = {}, res: Res) {
    res.sendJson({ pathParams });
  }
}
