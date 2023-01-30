import { Extension } from '@ditsmod/core';
import { InjectionToken } from '@ditsmod/core';

export const SQB_EXTENSIONS = new InjectionToken<Extension<void>[]>('SQB_EXTENSIONS');
export interface TableConfig {
  tableName?: string;
}

export type OneSqlExpression = [any, string, any] | [any];
