import { controller, Req, Res, route } from '@ditsmod/core';

@controller()
export class CommentsController {
  /**
   * As you seen, you can apply multi `@route` statement to a single method.
   */
  @route('GET')
  @route('GET', ':commentId')
  sendComments(req: Req, res: Res) {
    const { pathParams } = req;
    res.sendJson({ pathParams });
  }
}
