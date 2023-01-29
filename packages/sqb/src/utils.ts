import { Class, reflector } from '@ditsmod/core';

import { TableConfig } from './types';

export function setAlias<T extends Class>(Cls: T, alias: string): InstanceType<T> {
  const newObj: any = {
    toString() {
      const config: TableConfig | undefined = reflector.getClassMetadata(Cls)[0]?.value;
      return `${config?.tableName || Cls.name} as ${alias}`;
    },
  };

  for (const key in new Cls()) {
    newObj[key] = `${alias}.${key}`;
  }

  return newObj;
}
