import { EntityDecoratorFactory, Entity } from '../decorators/entity';
import { ColumnsDecoratorFactory, Column } from '../decorators/column';

export const MysqlEntity = Entity as EntityDecoratorFactory<MysqlTableOptions>;
export const MysqlColumn = Column as ColumnsDecoratorFactory<MysqlColumnOptions>;

export class MysqlTableOptions {
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

export interface MysqlColumnOptions {
  /**
   * Data type.
   */
  dataType?: DataType;
  isPrimaryColumn?: boolean;
  /**
   * Column name in the database table.
   * By default the column name is generated from the name of the property.
   * You can change it by specifying your own name.
   */
  columnName?: string;
}

export type DataType = { INT: number } | { VARCHAR: string } | { DATETIME: string } | { DATE: string };
