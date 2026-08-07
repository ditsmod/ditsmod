import { Reflector } from '@holu/core';
import type { TableConfig } from '../types.js';

export const table = Reflector.makeClassDecorator((config: TableConfig) => config);
