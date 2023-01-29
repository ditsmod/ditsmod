import { makeClassDecorator } from '@ditsmod/core';

import { TableConfig } from '../types';

export const table = makeClassDecorator((config: TableConfig) => config);
