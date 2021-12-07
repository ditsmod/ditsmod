import { Controller, Req, Res, Route } from '@ditsmod/core';

@Controller()
export class CommentsController {
  constructor(private req: Req, private res: Res) {}

  /**
   * As you seen, you can apply multi `@Route` statement to a single method.
   */
  @Route('GET')
  @Route('GET', ':commentId')
  sendComments() {
    const { pathParams } = this.req;
    this.res.sendJson({ pathParams });
  }
}
