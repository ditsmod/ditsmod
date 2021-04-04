import { InjectionToken } from '@ts-stack/di';

import { Extension } from './extension';
import { BaseRouteData } from './route-data';

export abstract class RoutesExtension implements Extension<BaseRouteData[]> {
  async init(): Promise<BaseRouteData[]> {
    return;
  }
}

export const ROUTES_EXTENSIONS = new InjectionToken<RoutesExtension[]>('ROUTES_EXTENSIONS');
