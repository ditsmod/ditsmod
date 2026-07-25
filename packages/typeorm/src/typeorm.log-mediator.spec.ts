import { jest } from '@jest/globals';
import type { ModuleInfo } from '@ditsmod/core';

import { TypeormLogMediator } from './typeorm.log-mediator.js';

describe('TypeormLogMediator', () => {
  let logMediator: TypeormLogMediator;
  let loggerMock: any;
  const self = {};

  beforeEach(() => {
    loggerMock = { log: jest.fn() };
    const moduleInfo: ModuleInfo = { moduleName: 'TestModule', isExternal: false };
    logMediator = new TypeormLogMediator(moduleInfo, undefined, loggerMock as any);
  });

  it('should log warning on duplicate data source name', () => {
    logMediator.duplicateDataSourceName(self, 'default');

    expect(loggerMock.log).toHaveBeenCalledWith(
      'warn',
      expect.stringContaining('[TestModule]: Object: A DataSource with the name "default" is already registered'),
    );
  });

  it('should log warning on duplicate data source registration in manager', () => {
    logMediator.duplicateDataSourceRegistration(self, 'analytics');

    expect(loggerMock.log).toHaveBeenCalledWith(
      'warn',
      expect.stringContaining('[TestModule]: Object: DataSource "analytics" is already registered'),
    );
  });

  it('should log error when failing to close data source', () => {
    logMediator.failedToCloseDataSource(self, 'default', new Error('Close timeout'));

    expect(loggerMock.log).toHaveBeenCalledWith(
      'error',
      expect.stringContaining('[TestModule]: Object: Failed to close DataSource "default": Close timeout'),
    );
  });

  it('should log error when database connection fails and retries', () => {
    logMediator.unableToConnectToDatabase(self, 'analytics', 1, ' Message: ECONNREFUSED.');

    expect(loggerMock.log).toHaveBeenCalledWith(
      'error',
      expect.stringContaining(
        '[TestModule]: Object: Unable to connect to the database (analytics). Message: ECONNREFUSED. Retrying (1)...',
      ),
    );
  });

  it('should log warning when DataSourceManager is not found', () => {
    logMediator.dataSourceManagerNotFound(self);

    expect(loggerMock.log).toHaveBeenCalledWith(
      'warn',
      expect.stringContaining('[TestModule]: Object: DataSourceManager not found in the app injector'),
    );
  });

  it('should log warning when DataSource is not found in app injector', () => {
    logMediator.dataSourceNotFoundInAppInjector(self, 'reporting');

    expect(loggerMock.log).toHaveBeenCalledWith(
      'warn',
      expect.stringContaining('[TestModule]: Object: DataSource "reporting" not found in the app injector'),
    );
  });
});
