import { FunctionFactoryProvider, type DeepModulesImporter } from '@ditsmod/core';

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
      useFactory: () => {
        throw new Error('You must override this provider.');
      },
    };
    return p;
  });
}
