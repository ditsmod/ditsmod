import { injectable, ModRefId, ModuleManager } from '@ditsmod/core';
import { ModuleWithTrpcRoutes } from '../types.js';

@injectable()
export class TrpcService {
  constructor(protected moduleManager: ModuleManager) {}

  getModuleConfig<T extends ModuleWithTrpcRoutes<any>>(modRefId: ModRefId<T>) {
    return this.moduleManager.getInstanceOf(modRefId, true).getRouterConfig();
  }
}
