import { jest } from '@jest/globals';
import type { BaseAppInitializer } from '#init/base-app-initializer.js';
import { AppReinitializer } from '#init/app-reinitializer.js';
import type { MutableModuleManager } from '#init/mutable-module-manager.js';
import type { SystemLogMediator } from '#logger/system-log-mediator.js';
import { LogMediator } from '#logger/log-mediator.js';

describe('AppReinitializer', () => {
  let appReinitializer: AppReinitializer;
  let mockAppInitializer: jest.Mocked<BaseAppInitializer>;
  let mockModuleManager: jest.Mocked<MutableModuleManager>;
  let mockLog: jest.Mocked<SystemLogMediator>;

  beforeEach(() => {
    mockAppInitializer = {
      bootstrapProvidersPerApp: jest.fn(),
      bootstrapModulesAndExtensions: jest.fn(),
    } as unknown as jest.Mocked<BaseAppInitializer>;

    mockModuleManager = {
      startTransaction: jest.fn(),
      reset: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
    } as unknown as jest.Mocked<MutableModuleManager>;

    mockLog = {
      flush: jest.fn(),
      preserveLogger: jest.fn(),
      restorePreviousLogger: jest.fn(),
      startReinitApp: jest.fn(),
      finishReinitApp: jest.fn(),
      printReinitError: jest.fn(),
      startRollbackModuleConfigChanges: jest.fn(),
      successfulRollbackModuleConfigChanges: jest.fn(),
      skippingAutocommitModulesConfig: jest.fn(),
      updateOutputLogLevel: jest.fn(),
    } as unknown as jest.Mocked<SystemLogMediator>;

    appReinitializer = new AppReinitializer(mockAppInitializer, mockModuleManager, mockLog);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reinit()', () => {
    it('should successfully reinit the app and commit transaction', async () => {
      await appReinitializer.reinit(true);

      expect(mockLog.flush).toHaveBeenCalled();
      expect(mockLog.preserveLogger).toHaveBeenCalled();
      expect(mockLog.startReinitApp).toHaveBeenCalledWith(appReinitializer);

      expect(mockModuleManager.startTransaction).toHaveBeenCalled();
      expect(mockModuleManager.reset).toHaveBeenCalled();
      expect(mockAppInitializer.bootstrapProvidersPerApp).toHaveBeenCalled();

      expect(mockAppInitializer.bootstrapModulesAndExtensions).toHaveBeenCalled();
      expect(mockModuleManager.commit).toHaveBeenCalled();
      expect(mockLog.finishReinitApp).toHaveBeenCalledWith(appReinitializer);

      expect(LogMediator.bufferLogs).toBe(false);
    });

    it('should successfully reinit the app and skip autocommit', async () => {
      await appReinitializer.reinit(false);

      expect(mockModuleManager.commit).not.toHaveBeenCalled();
      expect(mockLog.skippingAutocommitModulesConfig).toHaveBeenCalledWith(appReinitializer);
      expect(mockLog.finishReinitApp).toHaveBeenCalledWith(appReinitializer);
    });

    it('should handle error during reset/bootstrapProvidersPerApp', async () => {
      const error = new Error('Test error');
      mockModuleManager.reset.mockImplementation(() => {
        throw error;
      });

      const result = await appReinitializer.reinit(true);

      expect(result).toBe(error);
      expect(mockLog.restorePreviousLogger).toHaveBeenCalled();
      expect(mockLog.printReinitError).toHaveBeenCalledWith(appReinitializer, error);
      expect(mockLog.startRollbackModuleConfigChanges).toHaveBeenCalledWith(appReinitializer);
      expect(mockModuleManager.rollback).toHaveBeenCalled();
      expect(mockAppInitializer.bootstrapProvidersPerApp).toHaveBeenCalled();
      expect(mockAppInitializer.bootstrapModulesAndExtensions).toHaveBeenCalled();
      expect(mockLog.successfulRollbackModuleConfigChanges).toHaveBeenCalledWith(appReinitializer);
    });

    it('should handle error during bootstrapModulesAndExtensions', async () => {
      const error = new Error('Test error 2');
      mockAppInitializer.bootstrapModulesAndExtensions.mockRejectedValueOnce(error).mockResolvedValueOnce(undefined as any);

      const result = await appReinitializer.reinit(true);

      expect(result).toBe(error);
      expect(mockLog.restorePreviousLogger).not.toHaveBeenCalled();
      expect(mockLog.printReinitError).toHaveBeenCalledWith(appReinitializer, error);
      expect(mockLog.startRollbackModuleConfigChanges).toHaveBeenCalledWith(appReinitializer);
      expect(mockModuleManager.rollback).toHaveBeenCalled();
      expect(mockAppInitializer.bootstrapProvidersPerApp).toHaveBeenCalled();
      expect(mockAppInitializer.bootstrapModulesAndExtensions).toHaveBeenCalled();
      expect(mockLog.successfulRollbackModuleConfigChanges).toHaveBeenCalledWith(appReinitializer);
    });
  });
});
