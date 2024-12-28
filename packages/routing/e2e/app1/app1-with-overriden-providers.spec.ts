import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { Providers } from '@ditsmod/core';
import { TestApplication } from '@ditsmod/testing';
import { TestRoutingPlugin } from '@ditsmod/routing-testing';

import { AppModule } from './app.module.js';
import {
  ServicePerApp,
  ServicePerMod,
  ServicePerRou,
  ServicePerReq,
  ServicePerRou2,
  ServicePerReq2,
} from './services.js';

describe('@ditsmod/routing/e2e', () => {
  const message = 'any-string';
  const implementation = () => message;
  const methodPerApp = vi.fn(implementation);
  const methodPerMod = vi.fn(implementation);
  const methodPerRou = vi.fn(implementation);
  const methodPerReq = vi.fn(implementation);
  const methodPerRou2 = vi.fn(implementation);
  const methodPerReq2 = vi.fn(implementation);

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('override services at any level', async () => {
    const aProvidersToOverride = new Providers()
      .useValue<ServicePerRou2>(ServicePerRou2, { method: methodPerRou2 })
      .useValue<ServicePerReq2>(ServicePerReq2, { method: methodPerReq2 });

    const server = await TestApplication.createTestApp(AppModule)
      .$use(TestRoutingPlugin)
      .overrideGroupRoutingMeta(aProvidersToOverride)
      .overrideModuleMeta(
        new Providers()
          .useValue<ServicePerApp>(ServicePerApp, { method: methodPerApp })
          .useValue<ServicePerMod>(ServicePerMod, { method: methodPerMod })
          .useValue<ServicePerRou>(ServicePerRou, { method: methodPerRou })
          .useValue<ServicePerReq>(ServicePerReq, { method: methodPerReq }),
      )
      .getServer();

    const testAgent = request(server);

    await testAgent.get('/per-app').expect(200).expect(message);
    await testAgent.get('/per-mod').expect(200).expect(message);
    await testAgent.get('/per-rou').expect(200).expect(message);
    await testAgent.get('/per-req').expect(200).expect(message);
    await testAgent.get('/per-rou2').expect(200).expect(message);
    await testAgent.get('/per-req2').expect(200).expect(message);
    expect(methodPerApp).toHaveBeenCalledTimes(1);
    expect(methodPerMod).toHaveBeenCalledTimes(1);
    expect(methodPerRou).toHaveBeenCalledTimes(1);
    expect(methodPerReq).toHaveBeenCalledTimes(1);
    expect(methodPerRou2).toHaveBeenCalledTimes(1);
    expect(methodPerReq2).toHaveBeenCalledTimes(1);

    server?.close();
  });
});
