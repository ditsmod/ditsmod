import { MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { ExtensionsContext } from './services/extensions-context.js';
import { ExtensionsManager } from './services/extensions-manager.js';
import { PerAppService } from './services/per-app.service.js';

export const defaultExtensionsProviders: Readonly<any[]> = [
  PerAppService,
  ExtensionsManager,
  ExtensionsContext,
  MetadataPerMod2,
];
