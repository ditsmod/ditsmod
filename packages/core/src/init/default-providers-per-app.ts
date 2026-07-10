import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleInfo } from '#types/module-extract.js';
import { Logger } from '#logger/logger.js';
import type { Provider } from '#di/top/types-and-models.js';
import { ProviderBuilder } from '#utils/providers.js';
import { ExtensionStatistics } from '#extension/counter.js';
import { PatchLogger } from '#logger/patch-logger.js';

export const defaultProvidersPerApp: Readonly<Provider[]> = [
  ...new ProviderBuilder()
    .passThrough(SystemLogMediator)
    .useValue(ExtensionStatistics, new ExtensionStatistics())
    .useValue<ModuleInfo>(ModuleInfo, { moduleName: 'app' })
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
];
