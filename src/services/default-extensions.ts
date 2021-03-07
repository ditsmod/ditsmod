import { Type } from '@ts-stack/di';

import { Extension } from '../types/extension';
import { PreRouter } from './pre-router';

export const defaultExtensions: Type<Extension>[] = [PreRouter];
