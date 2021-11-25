import { PRE_ROUTER_EXTENSIONS, ROUTES_EXTENSIONS } from '../constans';
import { PreRouterExtension } from '../extensions/pre-router.extension';
import { RoutesExtension } from '../extensions/routes.extension';
import { ExtensionsProvider } from '../types/mix';

export const defaultExtensions: Readonly<ExtensionsProvider[]> = [
  { provide: PRE_ROUTER_EXTENSIONS, useClass: PreRouterExtension, multi: true },
  { provide: ROUTES_EXTENSIONS, useClass: RoutesExtension, multi: true },
];
