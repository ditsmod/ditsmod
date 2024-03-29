import { injectable } from '#di';
import { ErrorMediator } from '#error/error-mediator.js';

@injectable()
export class SystemErrorMediator extends ErrorMediator {
  /**
   * no provider for ${tokenName}! ${partMsg}.
   */
  throwNoProviderDuringResolveImports(moduleName: string, tokenName: string, partMsg: string) {
    throw new Error(`${moduleName}: no provider for ${tokenName}! ${partMsg}.`);
  }
}
