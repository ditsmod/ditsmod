import { inject, injectable, ModRefId, ModuleManager } from '@ditsmod/core';

import { TRPC_ROOT } from './constants.js';
import { TrpcRootObject, ModuleWithTrpcRoutes } from './types.js';
import { PreRouter } from './pre-router.js';

@injectable()
export class TrpcService {
  constructor(
    protected preRouter: PreRouter,
    protected moduleManager: ModuleManager,
    @inject(TRPC_ROOT) protected t: TrpcRootObject<any>,
  ) {}

  getModuleConfig<T extends ModuleWithTrpcRoutes<any>>(modRefId: ModRefId<T>) {
    return this.moduleManager.getInstanceOf(modRefId, true).getRouterConfig();
  }
}
