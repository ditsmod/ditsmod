import { MetadataPerMod1 } from '#types/metadata-per-mod.js';
import { ExtensionsContext } from './extensions-context.js';
import { ExtensionsManager } from './extensions-manager.js';
import { PerAppService } from './per-app.service.js';

export const defaultExtensionsProviders: Readonly<any[]> = [
  PerAppService,
  ExtensionsManager,
  ExtensionsContext,
  MetadataPerMod1,
];
