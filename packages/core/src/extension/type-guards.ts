import { Class } from '#di/types-and-models.js';
import { Extension } from '#extension/extension-types.js';

export function isExtensionProvider(provider?: Class): provider is Class<Extension> {
  return (
    typeof (provider?.prototype as Extension)?.stage1 == 'function' ||
    typeof (provider?.prototype as Extension)?.stage2 == 'function' ||
    typeof (provider?.prototype as Extension)?.stage3 == 'function'
  );
}
