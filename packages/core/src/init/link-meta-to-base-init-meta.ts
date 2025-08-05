import { BaseInitMeta } from '#types/base-meta.js';

export function linkMetaToBaseInitMeta(baseInitMeta: BaseInitMeta, meta: BaseInitMeta) {
  (
    [
      'importsModules',
      'importsWithParams',
      'providersPerApp',
      'providersPerMod',
      'exportsModules',
      'exportsWithParams',
      'exportedProvidersPerMod',
      'exportedMultiProvidersPerMod',
      'resolvedCollisionsPerApp',
      'resolvedCollisionsPerMod',
      'extensionsProviders',
      'exportedExtensionsProviders',
      'aExtensionConfig',
      'aOrderedExtensions',
      'aExportedExtensionConfig',
      'extensionsMeta',
    ] satisfies (keyof BaseInitMeta)[]
  ).forEach(<T extends keyof BaseInitMeta>(prop: T) => {
    meta[prop] = baseInitMeta[prop];
  });
}
