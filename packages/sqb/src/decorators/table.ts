import { makeClassDecorator } from '@ditsmod/core';

import { TableConfig } from '../types.js';

export const table = makeClassDecorator((config: TableConfig) => config);
