import { Injector } from '@ditsmod/core';
import { Res } from '@ditsmod/routing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommentsController } from './comments.controller.js';

describe('CommentsController', () => {
  const sendJson = vi.fn();
  const res = { sendJson } as unknown as Res;
  let commentsController: CommentsController;

  beforeEach(() => {
    vi.restoreAllMocks();
    const injector = Injector.resolveAndCreate([CommentsController]);
    commentsController = injector.get(CommentsController);
  });

  it('should say "Hello, World!"', () => {
    expect(() => commentsController.sendComments(res)).not.toThrow();
    expect(sendJson).toHaveBeenCalledTimes(1);
  });
});