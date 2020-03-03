import { Type } from '@ts-stack/di';

import { EntityModel, DatabaseService } from '../decorators/entity';
import { ColumnType } from '../decorators/column';
import { MysqlColumnOptions } from './mysql-decorators';

export class Translated {
  /**
   * Database service.
   */
  db: DatabaseService;
  insert: [string, any] | [string] = [''];
  findAll: [string, any] | [string] = [''];
  find: [string, any] | [string] = [''];
  update: [string, any] | [string] = [''];
  delete: [string, any] | [string] = [''];
}

export interface Driver {
  loadMapping(entitiesMap: Map<EntityModel, Type<any>>): Map<EntityModel, Translated>;
}

export class MysqlColumnsMetadata {
  [field: string]: [ColumnType, MysqlColumnOptions];
}

export class MysqlMetadata {
  tableName: string;
  primaryColumns: string[];
}
