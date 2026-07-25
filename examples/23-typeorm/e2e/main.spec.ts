import { jest } from '@jest/globals';
import request from 'supertest';
import { ProviderBuilder, LoggerConfig } from '@ditsmod/core';
import { restRootModule, HttpServer } from '@ditsmod/rest';
import { TestRestApplication } from '@ditsmod/rest-testing';
import { TypeormModule } from '@ditsmod/typeorm';
import type { DataSource, EntityManager } from 'typeorm';

import { UserModule } from '#app/modules/user/user.module.js';
import { SystemModule } from '#app/modules/system/system.module.js';
import { User } from '#app/modules/user/user.entity.js';

function createMockDataSource() {
  const users: any[] = [];
  const mockRepo = {
    find: jest.fn<any>().mockImplementation(async () => users),
    create: jest.fn<any>().mockImplementation((dto: any) => ({ id: users.length + 1, ...dto })),
    save: jest.fn<any>().mockImplementation(async (entity: any) => {
      users.push(entity);
      return entity;
    }),
  };

  const ds = {
    isInitialized: false,
    entityMetadatas: [{ target: User }],
    initialize: jest.fn<any>().mockImplementation(async () => {
      (ds as any).isInitialized = true;
      return ds;
    }),
    destroy: jest.fn<any>().mockImplementation(async () => {
      (ds as any).isInitialized = false;
    }),
    getRepository: jest.fn<any>().mockReturnValue(mockRepo),
    getTreeRepository: jest.fn<any>().mockReturnValue(mockRepo),
    manager: {} as EntityManager,
  } as unknown as DataSource;

  return ds;
}

const mockDs = createMockDataSource();

@restRootModule({
  appends: [UserModule, SystemModule],
  imports: [
    TypeormModule.forRoot({
      dataSourceFactory: async () => mockDs,
    }),
  ],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'off' }),
})
class TestAppModule {}

describe('23-typeorm E2E', () => {
  let app: TestRestApplication;
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    app = TestRestApplication.createTestApp(TestAppModule);
    server = await app.getServer();
    testAgent = request(server);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should check db status via /db-status', async () => {
    const res = await testAgent.get('/db-status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      isConnected: true,
      hasEntityManager: true,
    });
  });

  it('should create and list users via /users', async () => {
    const postRes = await testAgent.post('/users');
    expect(postRes.status).toBe(200);
    expect(postRes.body).toEqual({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
    });

    const getRes = await testAgent.get('/users');
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveLength(1);
    expect(getRes.body[0]).toEqual({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
    });
  });
});
