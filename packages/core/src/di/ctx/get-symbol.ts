export interface InjectionSymbol<T> {}

/**
 * Returns a symbol associated with the type `T`.
 */
export function getSymbol<T = unknown>(description?: string) {
  return Symbol(description) as InjectionSymbol<T>;
}
