import { Injector } from '@ditsmod/core';
import { Res } from '@ditsmod/routing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PostsController } from './posts.controller.js';

describe('PostsController', () => {
  const sendJson = vi.fn();
  const res = { sendJson } as unknown as Res;
  let postsController: PostsController;

  beforeEach(() => {
    vi.restoreAllMocks();
    const injector = Injector.resolveAndCreate([PostsController]);
    postsController = injector.get(PostsController);
  });

  it('should say "Hello, World!"', () => {
    expect(() => postsController.sendPosts(res)).not.toThrow();
    expect(sendJson).toHaveBeenCalledTimes(1);
  });
});