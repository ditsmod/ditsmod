import request from 'supertest';
import { TestApplication } from '@ditsmod/testing';
import { NodeServer } from '@ditsmod/core';

import { AppModule } from '#app/app.module.js';

describe('05-nested-routes', () => {
  let server: NodeServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    server = await new TestApplication(AppModule, { path: 'api' }).getServer();
    testAgent = request(server);
  });

  afterAll(() => {
    server.close();
  });

  it('should works with /api/posts', async () => {
    await testAgent.get('/api/posts').expect(200).expect({ pathParams: {} });
  });

  it('should works with /api/posts/123', async () => {
    await testAgent
      .get('/api/posts/123')
      .expect(200)
      .expect({ pathParams: { postId: '123' } });
  });

  it('should works with /api/posts/123/comments', async () => {
    await testAgent
      .get('/api/posts/123/comments')
      .expect(200)
      .expect({ pathParams: { postId: '123' } });
  });

  it('should works with /api/posts/123/comments/456', async () => {
    await testAgent
      .get('/api/posts/123/comments/456')
      .expect(200)
      .expect({ pathParams: { postId: '123', commentId: '456' } });
  });
});
