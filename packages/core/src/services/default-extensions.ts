import { PRE_ROUTER_EXTENSIONS, ROUTES_EXTENSIONS } from '../constans';
import { PreRouterExtension } from '../extensions/pre-router.extension';
import { RoutesExtension } from '../extensions/routes.extension';
import { InjectorPerApp } from '../models/injector-per-app';
import { MetadataPerMod1 } from '../types/metadata-per-mod';
import { ExtensionsProvider, ServiceProvider } from '../types/mix';
import { ExtensionsContext } from './extensions-context';
import { ExtensionsManager } from './extensions-manager';

export const defaultExtensions: Readonly<ExtensionsProvider[]> = [
  { provide: PRE_ROUTER_EXTENSIONS, useClass: PreRouterExtension, multi: true },
  { provide: ROUTES_EXTENSIONS, useClass: RoutesExtension, multi: true },
];

export const defaultExtensionsServices: Readonly<ServiceProvider[]> = [
  ExtensionsManager,
  ExtensionsContext,
  MetadataPerMod1,
  InjectorPerApp as any,
];
