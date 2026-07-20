import 'reflect-metadata/lite';
import { jest } from '@jest/globals';

import { Injector, Logger, ResolvedModuleMeta } from '@ditsmod/core';

import { cron } from './cron.decorator.js';
import { interval } from './interval.decorator.js';
import { ScheduleExtension } from './schedule.extension.js';
import { SchedulerOrchestrator } from './scheduler.orchestrator.js';
import { timeout } from './timeout.decorator.js';

describe('ScheduleExtension', () => {
  let orchestratorMock: jest.Mocked<SchedulerOrchestrator>;
  let loggerMock: jest.Mocked<Logger>;
  let injectorPerModMock: jest.Mocked<Injector>;
  let injectorPerAppMock: jest.Mocked<Injector>;
  let resolvedMetadataMock: ResolvedModuleMeta;
  let extension: ScheduleExtension;

  class ModService {
    @cron('* * * * * *', { name: 'cron1' })
    cronMethod() {}

    @interval(1000)
    intervalMethod() {}
  }

  class AppService {
    @timeout('timeout1', 2000)
    timeoutMethod() {}
  }

  class RequestService {
    @cron('* * * * * *')
    requestMethod() {}
  }

  beforeEach(() => {
    orchestratorMock = {
      addCron: jest.fn(),
      addInterval: jest.fn(),
      addTimeout: jest.fn(),
      mountJobs: jest.fn(),
    } as any;

    loggerMock = {
      log: jest.fn(),
    } as any;

    // injectorPerApp mock returns the orchestrator
    injectorPerAppMock = {
      get: jest.fn().mockReturnValue(orchestratorMock),
    } as any;

    const modInstance = new ModService();
    const appInstance = new AppService();

    // injectorPerMod mock: resolves services, and has a parent (the App injector)
    injectorPerModMock = {
      get: jest.fn().mockImplementation((token: any) => {
        if (token === ModService) return modInstance;
        if (token === AppService) return appInstance;
        return null;
      }),
      parent: injectorPerAppMock,
    } as any;

    resolvedMetadataMock = {
      normalizedModuleMeta: {
        providersPerMod: [ModService],
        providersPerApp: [AppService],
        providersPerRou: [],
        providersPerReq: [RequestService],
      },
    } as any;

    extension = new ScheduleExtension(resolvedMetadataMock, loggerMock);
  });

  it('should scan and collect providers in stage1, and warn about request-scoped ones', async () => {
    await extension.stage1(true);

    expect(loggerMock.log).toHaveBeenCalledWith(
      'warn',
      expect.stringContaining(
        'Cannot register schedule on "RequestService@requestMethod" because it is defined in a request-scoped provider.',
      ),
    );

    const scanned = (extension as any).scannedProviders;
    expect(scanned.has(ModService)).toBe(true);
    expect(scanned.has(AppService)).toBe(true);
    expect(scanned.has(RequestService)).toBe(false);
  });

  it('should instantiate and register jobs in stage2', async () => {
    await extension.stage1(true);
    await extension.stage2(injectorPerModMock);

    expect(orchestratorMock.addCron).toHaveBeenCalledWith('cron1', expect.any(Function), expect.any(Object));
    expect(orchestratorMock.addInterval).toHaveBeenCalledWith(expect.any(String), expect.any(Function), 1000);
    expect(orchestratorMock.addTimeout).toHaveBeenCalledWith('timeout1', expect.any(Function), 2000);
  });

  it('should trigger orchestrator.mountJobs in stage3', async () => {
    await extension.stage1(true);
    await extension.stage2(injectorPerModMock);
    await extension.stage3();
    expect(orchestratorMock.mountJobs).toHaveBeenCalledTimes(1);
  });
});
