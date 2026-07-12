import { jest } from '@jest/globals';

import { HTTP_INTERCEPTORS } from '@ditsmod/rest';

import type { SentryExtension as SentryExtensionType } from './sentry.extension.js';

// Mock Sentry core isolation scope functions preserving other exports
jest.unstable_mockModule('@sentry/core', async () => {
  const actual = await jest.requireActual<any>('@sentry/core');
  return {
    ...actual,
    getClient: jest.fn(() => ({
      getDsn: () => ({}),
    })),
  };
});

// Import dynamically after mock
const { SentryExtension } = await import('./sentry.extension.js');
const { SentrySpanInterceptor } = await import('./sentry-span.interceptor.js');
const { SentryTracingInterceptor } = await import('./sentry-tracing.interceptor.js');

describe('SentryExtension', () => {
  let extension: SentryExtensionType;
  let extensionManager: any;
  let logger: any;

  beforeEach(() => {
    extensionManager = {
      stage1: jest.fn(),
    };
    logger = {
      log: jest.fn(),
    };
    extension = new SentryExtension(extensionManager, logger);
  });

  it('should push tracing and span interceptors to providersPerReq of all controllers', async () => {
    const mockControllerMetadata = {
      providersPerReq: [] as any[],
      routeMeta: {} as any,
    };

    const mockRouteExtensionMeta = {
      aControllerMetadata: [mockControllerMetadata],
    };

    extensionManager.stage1.mockResolvedValue({
      groupData: [mockRouteExtensionMeta],
    });

    await extension.stage1();

    expect(mockControllerMetadata.providersPerReq).toContain(SentrySpanInterceptor);
    expect(mockControllerMetadata.providersPerReq).toContainEqual({
      token: HTTP_INTERCEPTORS,
      useToken: SentrySpanInterceptor,
      multi: true,
    });

    expect(mockControllerMetadata.providersPerReq).toContain(SentryTracingInterceptor);
    expect(mockControllerMetadata.providersPerReq).toContainEqual({
      token: HTTP_INTERCEPTORS,
      useToken: SentryTracingInterceptor,
      multi: true,
    });
  });

  it('should skip registration and log warning if Sentry is not initialized', async () => {
    const { getClient } = (await import('@sentry/core')) as any;
    getClient.mockReturnValue(undefined);

    const mockControllerMetadata = {
      providersPerReq: [] as any[],
      routeMeta: {} as any,
    };
    const mockRouteExtensionMeta = {
      aControllerMetadata: [mockControllerMetadata],
    };
    extensionManager.stage1.mockResolvedValue({
      groupData: [mockRouteExtensionMeta],
    });

    await extension.stage1();

    expect(extensionManager.stage1).not.toHaveBeenCalled();
    expect(mockControllerMetadata.providersPerReq).toHaveLength(0);
    expect(logger.log).toHaveBeenCalledWith('warn', expect.stringContaining('Sentry.init() was not called'));
  });
});
