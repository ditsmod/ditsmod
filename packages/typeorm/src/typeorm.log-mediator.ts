import { injectable, LogMediator } from '@ditsmod/core';

@injectable()
export class TypeormLogMediator extends LogMediator {
  /**
   * `warn: ${className}: A DataSource with the name "${dataSourceName}" is already registered...`
   */
  duplicateDataSourceName(self: object, dataSourceName: string) {
    const className = self.constructor.name;
    this.setLog(
      'warn',
      `${className}: A DataSource with the name "${dataSourceName}" is already registered. ` +
        'Multiple DataSources must use unique names; otherwise they will override each other. ' +
        'Assign a unique "name" property to each TypeormModule.forRoot() call.',
    );
  }

  /**
   * `warn: ${className}: DataSource "${dataSourceName}" is already registered. It will be overwritten.`
   */
  duplicateDataSourceRegistration(self: object, dataSourceName: string) {
    const className = self.constructor.name;
    this.setLog('warn', `${className}: DataSource "${dataSourceName}" is already registered. It will be overwritten.`);
  }

  /**
   * `error: ${className}: Failed to close DataSource "${dataSourceName}": ${errMessage}`
   */
  failedToCloseDataSource(self: object, dataSourceName: string, err: any) {
    const className = self.constructor.name;
    const errMessage = err?.message || err;
    this.setLog('error', `${className}: Failed to close DataSource "${dataSourceName}": ${errMessage}`);
  }

  /**
   * `error: ${className}: Unable to connect to the database... Retrying (${attempt})...`
   */
  unableToConnectToDatabase(self: object, dataSourceName: string, attempt: number, verboseMessage: string = '') {
    const className = self.constructor.name;
    const dsInfo = dataSourceName === 'default' ? '' : ` (${dataSourceName})`;
    this.setLog(
      'error',
      `${className}: Unable to connect to the database${dsInfo}.${verboseMessage} Retrying (${attempt})...`,
    );
  }

  /**
   * `warn: ${className}: DataSourceManager not found in the app injector...`
   */
  dataSourceManagerNotFound(self: object) {
    const className = self.constructor.name;
    this.setLog(
      'warn',
      `${className}: DataSourceManager not found in the app injector. ` +
        'DataSource connections will not be managed for graceful shutdown. ' +
        'Ensure TypeormModule is imported in your root module.',
    );
  }

  /**
   * `warn: ${className}: DataSource "${dataSourceName}" not found in the app injector...`
   */
  dataSourceNotFoundInAppInjector(self: object, dataSourceName: string) {
    const className = self.constructor.name;
    this.setLog(
      'warn',
      `${className}: DataSource "${dataSourceName}" not found in the app injector. ` +
        'It will not be managed for graceful shutdown. ' +
        'This may indicate that stage1() failed or was not called for this DataSource.',
    );
  }
}
