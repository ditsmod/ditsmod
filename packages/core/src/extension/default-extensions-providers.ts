import { MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { ExtensionsManager } from '#extension/extensions-manager.js';
import { PerAppService } from '#services/per-app.service.js';

export const defaultExtensionsProviders: Readonly<any[]> = [
  PerAppService,
  ExtensionsManager,
  ExtensionsContext,
  MetadataPerMod2,
];
