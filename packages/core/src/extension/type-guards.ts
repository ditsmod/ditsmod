import type { Class } from '#di/top/types-and-models.js';
import type { Extension } from '#extension/extension-types.js';
import type { AnyObj } from '#types/mix.js';
import type { ExtensionConfig } from './tarjan-graph.js';

export function isExtensionProvider(provider?: any): provider is Class<Extension> {
  return (
    typeof (provider?.prototype as Extension)?.stage1 == 'function' ||
    typeof (provider?.prototype as Extension)?.stage2 == 'function' ||
    typeof (provider?.prototype as Extension)?.stage3 == 'function'
  );
}
export function isExtensionConfig<T>(extensionConfig: AnyObj): extensionConfig is ExtensionConfig<T> {
  return Boolean((extensionConfig as ExtensionConfig<T>).extension);
}
