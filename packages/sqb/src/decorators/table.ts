import { Reflector } from '@ditsmod/core';
import { TableConfig } from '../types.js';

export const table = Reflector.makeClassDecorator((config: TableConfig) => config);
