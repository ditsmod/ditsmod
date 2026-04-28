import { MetadataPerMod2 } from '#types/metadata-per-mod.js';
import { ExtensionsContext } from '#extension/extensions-context.js';
import { ExtensionManager } from '#extension/extension-manager.js';
import { PerAppService } from '#services/per-app.service.js';

export const defaultExtensionsProviders: Readonly<any[]> = [
  PerAppService,
  ExtensionManager,
  ExtensionsContext,
  MetadataPerMod2,
];
