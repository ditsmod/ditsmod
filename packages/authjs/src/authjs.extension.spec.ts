import { jest } from '@jest/globals';

import type { ExtensionManager, Injector } from '@holu/core';
import { RestRouteExtension } from '@holu/rest';
import { AuthjsExtension } from './authjs.extension.js';
import type { AuthjsLogMediator } from './authjs-log-mediator.js';
import { AuthjsInterceptor } from './authjs.interceptor.js';
import { AuthjsConfig } from './authjs.config.js';

describe('AuthjsExtension', () => {
  let extensionManager: ExtensionManager;
  let logMediator: AuthjsLogMediator;
  let extension: AuthjsExtension;

  beforeEach(() => {
    extensionManager = { stage1: jest.fn() } as unknown as ExtensionManager;
    logMediator = { message: jest.fn() } as unknown as AuthjsLogMediator;
    extension = new AuthjsExtension(extensionManager, logMediator);
  });

  it('stage1 calls extensionManager.stage1(RestRouteExtension)', async () => {
    const mockGroupMeta = { groupData: [] };
    (extensionManager.stage1 as jest.MockedFunction<any>).mockResolvedValue(mockGroupMeta);

    await extension.stage1();

    expect(extensionManager.stage1).toHaveBeenCalledWith(RestRouteExtension);
  });

  describe('stage2', () => {
    let authjsConfig: AuthjsConfig;
    let injectorPerMod: Injector;

    beforeEach(() => {
      authjsConfig = new AuthjsConfig();
      injectorPerMod = {
        get: jest.fn().mockImplementation((token) => {
          if (token === AuthjsConfig) return authjsConfig;
          return undefined;
        }),
      } as unknown as Injector;
    });

    it('sets default authjs logger when no AuthjsInterceptor route is present', async () => {
      (extension as any).extensionGroupMeta = {
        groupData: [
          {
            controllersMeta: [{ fullPath: 'some/path', interceptors: [], httpMethods: ['GET'] }],
          },
        ],
      };

      await extension.stage2(injectorPerMod);

      expect(authjsConfig.basePath).toBeUndefined();
      expect(authjsConfig.logger).toBeDefined();
    });

    it('throws error when URL path format is invalid for AuthjsInterceptor', async () => {
      (extension as any).extensionGroupMeta = {
        groupData: [
          {
            controllersMeta: [
              {
                fullPath: 'api/auth',
                interceptors: [AuthjsInterceptor],
                httpMethods: ['GET'],
              },
            ],
          },
        ],
      };

      await expect(extension.stage2(injectorPerMod)).rejects.toThrow('Unexpected URL for Auth.js: "GET api/auth"');
    });

    it('configures basePath and pushes GET and POST methods when valid AuthjsInterceptor route is found', async () => {
      const controllersMeta: any[] = [
        {
          fullPath: 'api/auth/:action/:param',
          interceptors: [AuthjsInterceptor],
          httpMethods: ['GET'],
        },
      ];
      (extension as any).extensionGroupMeta = {
        groupData: [{ controllersMeta }],
      };

      await extension.stage2(injectorPerMod);

      expect(authjsConfig.basePath as unknown as string).toBe('/api/auth');
      expect(controllersMeta.length).toBe(2);
      expect(controllersMeta[1]).toEqual({
        fullPath: 'api/auth/:action',
        interceptors: [AuthjsInterceptor],
        httpMethods: ['GET', 'POST'],
      });
    });

    it('does not modify methods when route has ALL method', async () => {
      const controllersMeta: any[] = [
        {
          fullPath: 'api/auth/:action/:param',
          interceptors: [AuthjsInterceptor],
          httpMethods: ['ALL'],
        },
      ];
      (extension as any).extensionGroupMeta = {
        groupData: [{ controllersMeta }],
      };

      await extension.stage2(injectorPerMod);

      expect(controllersMeta.length).toBe(2);
      expect(controllersMeta[1]).toEqual({
        fullPath: 'api/auth/:action',
        interceptors: [AuthjsInterceptor],
        httpMethods: ['ALL'],
      });
    });

    it('authjs logger callbacks trigger logMediator.message', async () => {
      (extension as any).extensionGroupMeta = { groupData: [] };

      await extension.stage2(injectorPerMod);

      const logger = authjsConfig.logger!;
      logger.debug?.('debug log');
      expect(logMediator.message).toHaveBeenCalledWith('debug', 'debug log');

      logger.warn?.('debug-url' as any);
      expect(logMediator.message).toHaveBeenCalledWith('warn', 'debug-url');

      const err = new Error('test error');
      logger.error?.(err);
      expect(logMediator.message).toHaveBeenCalledWith('error', expect.stringContaining('test error'));
    });

    it('authjs logger logs expected client authentication errors as warn without stack trace', async () => {
      (extension as any).extensionGroupMeta = { groupData: [] };
      await extension.stage2(injectorPerMod);

      const logger = authjsConfig.logger!;
      const credErr = new Error('Read more at https://errors.authjs.dev#credentialssignin');
      credErr.name = 'CredentialsSignin';
      logger.error?.(credErr);

      expect(logMediator.message).toHaveBeenCalledWith(
        'warn',
        'CredentialsSignin: Read more at https://errors.authjs.dev#credentialssignin',
      );
    });
  });
});
