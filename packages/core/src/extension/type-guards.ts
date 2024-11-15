import { Class, Provider } from '#di/types-and-models.js';
import { Extension } from '#extension/extension-types.js';

export function isExtensionProvider(provider?: Provider): provider is Class<Extension> {
  const init = (provider as Class<Extension>)?.prototype?.init;
  return typeof init == 'function';
}
