import { InjectionToken } from '@ts-stack/di';

import { Extension } from './extension';
import { PreRouteMeta } from './route-data';

export abstract class RoutesExtension implements Extension<PreRouteMeta[]> {
  async init(): Promise<PreRouteMeta[]> {
    return;
  }
}

export const ROUTES_EXTENSIONS = new InjectionToken<RoutesExtension[]>('ROUTES_EXTENSIONS');
