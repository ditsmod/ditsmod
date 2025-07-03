import { Injector } from '@ditsmod/core';
import { Res } from '@ditsmod/rest';

import { CommentsController } from './comments.controller.js';

describe('CommentsController', () => {
  const sendJson = jest.fn();
  const res = { sendJson } as unknown as Res;
  let commentsController: CommentsController;

  beforeEach(() => {
    jest.restoreAllMocks();
    const injector = Injector.resolveAndCreate([CommentsController]);
    commentsController = injector.get(CommentsController);
  });

  it('should say "Hello, World!"', () => {
    expect(() => commentsController.sendComments(res)).not.toThrow();
    expect(sendJson).toHaveBeenCalledTimes(1);
  });
});