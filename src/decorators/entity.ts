import { makeDecorator } from 'ts-di';

export interface EntityDecoratorFactory {
  (options?: EntityDecorator): any;
  new (options?: EntityDecorator): EntityDecorator;
}

export type EntityDecorator = MysqlTableOptions;

export interface MysqlTableOptions {
  tableName?: string;
  /**
   * Example: `utf8_general_ci`, `latin1_swedish_ci` etc.
   */
  collation?: string;
  /**
   * Example: `InnoDB`, `MyISAM`, `MEMORY` etc.
   */
  engine?: string;
}

export const Entity = makeDecorator('Entity', (data: any) => data) as EntityDecoratorFactory;
