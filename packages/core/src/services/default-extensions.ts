import { EXTENSIONS_COUNTERS, PRE_ROUTER_EXTENSIONS, ROUTES_EXTENSIONS } from '#constans';
import { MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { ExtensionProvider } from '#types/mix.js';
import { PreRouterExtension } from '../extensions/pre-router.extension.js';
import { RoutesExtension } from '../extensions/routes.extension.js';
import { ExtensionsContext } from './extensions-context.js';
import { ExtensionsManager } from './extensions-manager.js';
import { PerAppService } from './per-app.service.js';

export const defaultExtensions: Readonly<ExtensionProvider[]> = [
  PreRouterExtension,
  RoutesExtension,
  { token: PRE_ROUTER_EXTENSIONS, useToken: PreRouterExtension, multi: true },
  { token: ROUTES_EXTENSIONS, useToken: RoutesExtension, multi: true },
];

export const defaultExtensionsTokens: Readonly<any[]> = [
  ExtensionsManager,
  ExtensionsContext,
  MetadataPerMod1,
  EXTENSIONS_COUNTERS,
  PerAppService,
];
