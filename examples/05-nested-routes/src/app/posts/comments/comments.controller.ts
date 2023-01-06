import { controller, RequestContext, route } from '@ditsmod/core';

@controller()
export class CommentsController {
  /**
   * As you seen, you can apply multi `@route` statement to a single method.
   */
  @route('GET')
  @route('GET', ':commentId')
  sendComments(ctx: RequestContext) {
    const { pathParams } = ctx.req;
    ctx.res.sendJson({ pathParams });
  }
}
