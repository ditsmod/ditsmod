import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleExtract } from '#types/module-extract.js';
import { Logger } from '#logger/logger.js';
import { Provider } from '#di/types-and-models.js';
import { Providers } from '#utils/providers.js';
import { Counter } from '#extension/counter.js';
import { PatchLogger } from '#logger/patch-logger.js';

export const defaultProvidersPerApp: Readonly<Provider[]> = [
  ...new Providers()
    .passThrough(SystemLogMediator)
    .useValue(Counter, new Counter())
    .useValue<ModuleExtract>(ModuleExtract, { moduleName: 'app' })
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
];
