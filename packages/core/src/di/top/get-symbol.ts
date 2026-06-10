export type InjectionSymbol<T = unknown> = symbol & { readonly __type?: T };

export function getSymbol<T = unknown>(description?: string) {
  return Symbol(description) as InjectionSymbol<T>;
}
