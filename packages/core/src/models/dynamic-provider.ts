import { ServiceProvider } from '../types/mix';

export interface ResolvedSiblings {
  providersPerMod: ServiceProvider[],
  providersPerRou: ServiceProvider[],
  providersPerReq: ServiceProvider[],
}

export class DynamicProviders {
  resolve: (providers: ResolvedSiblings) => void;
  #promise: Promise<ResolvedSiblings>;

  constructor() {
    this.#promise = new Promise<ResolvedSiblings>((resolve) => {
      this.resolve = resolve;
    });
  }

  getPromise() {
    return this.#promise;
  }
}
