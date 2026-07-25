import { jest } from '@jest/globals';
import request from 'supertest';
import { ProviderBuilder, LoggerConfig } from '@ditsmod/core';
import { controller, route, restRootModule, restModule, HttpServer } from '@ditsmod/rest';
import { TestRestApplication } from '@ditsmod/rest-testing';
import { DataSource, Repository, EntityManager } from 'typeorm';

import { TypeormModule, InjectRepository, InjectDataSource, InjectEntityManager } from '#src/index.js';

class User {
  id!: number;
  name!: string;
}

class LogEntity {
  id!: number;
  message!: string;
}

@controller()
class UserController {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectDataSource() private ds: DataSource,
    @InjectEntityManager() private em: EntityManager,
  ) {}

  @route('GET', 'users')
  async getUsers() {
    const users = await this.userRepo.find();
    return {
      users,
      dsConnected: this.ds.isInitialized,
      hasEm: !!this.em,
    };
  }
}

@restModule({
  imports: [TypeormModule.forFeature([User])],
  controllers: [UserController],
})
class UserModule {}

@controller()
class AnalyticsController {
  constructor(
    @InjectRepository(LogEntity, 'analytics') private logRepo: Repository<LogEntity>,
    @InjectDataSource('analytics') private analyticsDs: DataSource,
  ) {}

  @route('GET', 'analytics/logs')
  async getLogs() {
    const logs = await this.logRepo.find();
    return {
      logs,
      analyticsDsConnected: this.analyticsDs.isInitialized,
    };
  }
}

@restModule({
  imports: [TypeormModule.forFeature([LogEntity], 'analytics')],
  controllers: [AnalyticsController],
})
class AnalyticsModule {}

function createMockDataSource(name: string, entities: any[]) {
  const data: Record<string, any[]> = {};
  const mockRepo = {
    find: jest.fn<any>().mockImplementation(async () => data[name] || []),
    save: jest.fn<any>().mockImplementation(async (entity: any) => entity),
  };

  const ds = {
    isInitialized: false,
    entityMetadatas: entities.map((entity) => ({ target: entity })),
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

const mockDefaultDs = createMockDataSource('default', [User]);
const mockAnalyticsDs = createMockDataSource('analytics', [LogEntity]);

@restRootModule({
  appends: [UserModule, AnalyticsModule],
  imports: [
    TypeormModule.forRoot({
      dataSourceFactory: async () => mockDefaultDs,
    }),
    TypeormModule.forRoot({
      name: 'analytics',
      dataSourceFactory: async () => mockAnalyticsDs,
    }),
  ],
  providersPerApp: new ProviderBuilder().useValue(LoggerConfig, { level: 'off' }),
})
class AppModule {}

describe('TypeormModule E2E', () => {
  let app: TestRestApplication;
  let server: HttpServer;
  let testAgent: ReturnType<typeof request>;

  beforeAll(async () => {
    app = TestRestApplication.createTestApp(AppModule);
    server = await app.getServer();
    testAgent = request(server);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should inject default DataSource, EntityManager and Repository', async () => {
    const res = await testAgent.get('/users');
    expect(res.status).toBe(200);
    expect(res.body.dsConnected).toBe(true);
    expect(res.body.hasEm).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('should inject named DataSource and Repository for analytics DB', async () => {
    const res = await testAgent.get('/analytics/logs');
    expect(res.status).toBe(200);
    expect(res.body.analyticsDsConnected).toBe(true);
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  it('should destroy DataSources on app close', async () => {
    expect(mockDefaultDs.isInitialized).toBe(true);
    expect(mockAnalyticsDs.isInitialized).toBe(true);

    await app.close();

    expect(mockDefaultDs.destroy).toHaveBeenCalled();
    expect(mockAnalyticsDs.destroy).toHaveBeenCalled();
    expect(mockDefaultDs.isInitialized).toBe(false);
    expect(mockAnalyticsDs.isInitialized).toBe(false);
  });
});
