import { Class, reflector } from '@ditsmod/core';

import { TableConfig } from './types.js';

export function getTableMetadata<T extends Class>(Cls: T, alias: string, withoutAlias?: boolean): TableMetadata<T> {
  const config: TableConfig | undefined = reflector.getClassMetadata(Cls)[0]?.value;
  const className = config?.tableName || Cls.name;
  const tableNameWithAlias = withoutAlias ? `${className}` : `${className} as ${alias}`;

  const newObj: any = {
    toString() {
      return tableNameWithAlias;
    },
  };

  for (const key in new Cls()) {
    newObj[key] = withoutAlias ? key : `${alias}.${key}`;
  }

  return [newObj, tableNameWithAlias, alias];
}

export type TableMetadata<T extends Class> = [Record<keyof InstanceType<T>, string>, string, string];
