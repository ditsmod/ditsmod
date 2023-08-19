import request = require('supertest');
import { TestApplication } from '@ditsmod/testing';
import { NodeServer } from '@ditsmod/core';

import { AppModule } from '../src/app/app.module';

describe('05-nested-routes', () => {
  let server: NodeServer;

  beforeAll(async () => {
    server = await new TestApplication(AppModule, { path: 'api' }).getServer();
  });

  afterAll(() => {
    server.close();
  });

  it('should works with /api/posts', async () => {
    await request(server).get('/api/posts').expect(200).expect({ pathParams: {} });
  });

  it('should works with /api/posts/123', async () => {
    await request(server)
      .get('/api/posts/123')
      .expect(200)
      .expect({ pathParams: { postId: '123' } });
  });

  it('should works with /api/posts/123/comments', async () => {
    await request(server)
      .get('/api/posts/123/comments')
      .expect(200)
      .expect({ pathParams: { postId: '123' } });
  });

  it('should works with /api/posts/123/comments/456', async () => {
    await request(server)
      .get('/api/posts/123/comments/456')
      .expect(200)
      .expect({ pathParams: { postId: '123', commentId: '456' } });
  });
});
