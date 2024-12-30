import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleExtract } from '#types/module-extract.js';
import { Logger } from '#logger/logger.js';
import { Provider } from '#types/mix.js';
import { RequestContext } from '#services/request-context.js';
import { Providers } from '#utils/providers.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { Counter } from '#extension/counter.js';
import { PreRouter } from '#services/pre-router.js';
import { PatchLogger } from '#logger/patch-logger.js';

export const defaultProvidersPerApp: Readonly<Provider[]> = [
  ...new Providers()
    .passThrough(PreRouter)
    .passThrough(SystemLogMediator)
    .passThrough(SystemErrorMediator)
    .passThrough(RequestContext)
    .useValue(Counter, new Counter())
    .useValue<ModuleExtract>(ModuleExtract, { moduleName: 'app' })
    .useFactory(Logger, [PatchLogger, PatchLogger.prototype.patchLogger]),
];
