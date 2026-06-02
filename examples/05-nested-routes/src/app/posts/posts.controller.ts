import { AnyObj, ctx } from '@ditsmod/core';
import { controller, route, PATH_PARAMS, RequestContext } from '@ditsmod/rest';

@controller()
export class PostsController {
  /**
   * As you seen, you can apply multi `@route` statement to a single method.
   */
  @route('GET')
  @route('GET', ':postId')
  sendPosts(reqCtx: RequestContext, @ctx(PATH_PARAMS) pathParams: AnyObj = {}) {
    reqCtx.sendJson({ pathParams });
  }
}
