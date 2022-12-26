import { controller, Req, Res, route } from '@ditsmod/core';

@controller()
export class CommentsController {
  constructor(private req: Req, private res: Res) {}

  /**
   * As you seen, you can apply multi `@route` statement to a single method.
   */
  @route('GET')
  @route('GET', ':commentId')
  sendComments() {
    const { pathParams } = this.req;
    this.res.sendJson({ pathParams });
  }
}
