import { BaseInitMeta } from '#types/base-meta.js';

export function copyBaseInitMeta(src: BaseInitMeta, dstn: BaseInitMeta) {
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
      // 'extensionsProviders',
      // 'exportedExtensionsProviders',
      // 'aExtensionConfig',
      // 'aOrderedExtensions',
      // 'aExportedExtensionConfig',
      // 'extensionsMeta',
    ] satisfies (keyof BaseInitMeta)[]
  ).forEach(<T extends keyof BaseInitMeta>(prop: T) => {
    if (Array.isArray(src[prop])) {
      dstn[prop].push(...src[prop]);
    } else {
      Object.assign(dstn[prop], src[prop]);
    }
  });
}
