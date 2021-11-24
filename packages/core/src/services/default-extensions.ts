import { PRE_ROUTER_EXTENSIONS, ROUTES_EXTENSIONS } from '../constans';
import { PreRouterExtension } from '../extensions/pre-router.extension';
import { RoutesExtension } from '../extensions/routes.extension';
import { ExtensionsProvider } from '../types/mix';
import { ExtensionsManager } from './extensions-manager';

export const defaultExtensions: Readonly<ExtensionsProvider[]> = [
  ExtensionsManager,
  PreRouterExtension,
  { provide: PRE_ROUTER_EXTENSIONS, useExisting: PreRouterExtension, multi: true },
  { provide: ROUTES_EXTENSIONS, useClass: RoutesExtension, multi: true },
];
