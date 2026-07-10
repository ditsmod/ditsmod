import { ResolvedModuleMetadata } from '#types/metadata-per-mod.js';
import { ExtensionContext } from '#extension/extensions-context.js';
import { ExtensionManager } from '#extension/extension-manager.js';
import { PROVIDERS_PER_APP } from '#init/constants.js';

export const defaultExtensionProviders: Readonly<any[]> = [
  ExtensionManager,
  ExtensionContext,
  ResolvedModuleMetadata,
  PROVIDERS_PER_APP,
];
