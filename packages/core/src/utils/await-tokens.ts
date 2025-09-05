import { FunctionFactoryProvider } from '#di/types-and-models.js';
import type { DeepModulesImporter } from '#init/deep-modules-importer.js';

/**
 * Since {@link DeepModulesImporter} runs before extensions, and it does not know which providers will be added
 * through extensions, it will throw errors if it cannot find a provider for a given dependency. This can be
 * avoided by using this helper to pass fake non-functional providers to DI, which should later be replaced
 * through extensions.
 */
export function awaitTokens(tokens: any): FunctionFactoryProvider[] {
  if (!Array.isArray(tokens)) {
    tokens = [tokens];
  }
  return (tokens as any[]).map((t) => {
    const p: FunctionFactoryProvider = {
      token: t,
      useFactory: throwUsingProvider,
    };
    return p;
  });
}

function throwUsingProvider() {
  throw new Error('You promised to override this provider, but you did not.');
}
