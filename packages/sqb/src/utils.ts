import { Class, reflector } from '@ditsmod/core';
import { TableConfig } from './types.js';

/**
 * Returns an array containing the following three elements:
 * 1. an object created from the `Cls` parameter, where each property contains a value in the pattern `${alias}.${key}` (or just `${key}` if `withoutAlias == true`);
 * 2. expression by the pattern `${tableName} as ${alias}` (or just `${tableName}` if the parameter `withoutAlias == true`);
 * 3. table alias.
 *
 * @param Cls The class used as a model. It should not have a constructor.
 * @param alias A database table alias.
 */
export function getTableMetadata<T extends Class>(Cls: T, alias: string, withoutAlias?: boolean): TableMetadata<T> {
  const config: TableConfig | undefined = reflector.getDecorators(Cls)?.at(0)?.value;
  const tableName = config?.tableName || Cls.name;
  const tableNameWithAlias = withoutAlias ? `${tableName}` : `${tableName} as ${alias}`;

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
export const defaultRunFn: (query: string, opts: any, ...args: any[]) => any = (query) => query;
export const defaultEscapeFn: (value: any) => string = (value) => value;

export interface QueryWithRunAndEscape {
  run: typeof defaultRunFn;
  escape: typeof defaultEscapeFn;
}

export function mergeEscapeAndRun(oldQuery: QueryWithRunAndEscape, newQuery: Partial<QueryWithRunAndEscape>) {
  if (newQuery.run && newQuery.run !== defaultRunFn) {
    oldQuery.run = newQuery.run;
  }
  if (newQuery.escape && newQuery.escape !== defaultEscapeFn) {
    oldQuery.escape = newQuery.escape;
  }
}
