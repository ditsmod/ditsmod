import { stringify } from '#di/stringify.js';
import type { FunctionFactoryProvider } from '#di/top/types-and-models.js';
import type { DeepModulesImporter } from '#init/deep-modules-importer.js';

/**
 * Since {@link DeepModulesImporter} runs before extensions, and it does not know which providers will be added
 * through extensions, it will throw errors if it cannot find a provider for a given dependency. This can be
 * avoided by using this helper to pass fake non-functional providers to DI, which should later be replaced
 * through extensions.
 */
export function awaitTokens(tokens: any, context?: string): FunctionFactoryProvider[] {
  if (!Array.isArray(tokens)) {
    tokens = [tokens];
  }
  return (tokens as any[]).map((t) => {
    const p: FunctionFactoryProvider = {
      token: t,
      useFactory: () => {
        let msg = `You promised to override this provider: ${stringify(t)}`;
        if (context) {
          msg += `, see: ${context}.`;
        }
        throw new Error(msg);
      },
    };
    return p;
  });
}
