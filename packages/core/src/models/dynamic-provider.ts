import { ServiceProvider } from '../types/mix';

export interface SiblingProviders {
  providersPerMod: ServiceProvider[],
  providersPerRou: ServiceProvider[],
  providersPerReq: ServiceProvider[],
}

export class DynamicProviders {
  resolve: (providers: SiblingProviders) => void;
  #promise: Promise<SiblingProviders>;

  constructor() {
    this.#promise = new Promise<SiblingProviders>((resolve) => {
      this.resolve = resolve;
    });
  }

  getPromise() {
    return this.#promise;
  }
}
