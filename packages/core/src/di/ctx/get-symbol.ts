// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
export interface InjectionSymbol<T = unknown> extends Symbol {}

/**
 * Returns a symbol associated with the type `T`.
 */
export function getSymbol<T = unknown>(description?: string) {
  return Symbol(description) as InjectionSymbol<T>;
}
