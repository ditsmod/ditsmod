import { BaseInitMeta } from '#types/base-meta.js';

export function copyMetaToBaseInitMeta(baseInitMeta: BaseInitMeta, meta: BaseInitMeta) {
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
    if (Array.isArray(baseInitMeta[prop])) {
      meta[prop].push(...baseInitMeta[prop]);
    } else {
      Object.assign(meta[prop], baseInitMeta[prop]);
    }
  });
}
