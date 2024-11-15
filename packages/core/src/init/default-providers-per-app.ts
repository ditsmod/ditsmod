import { SystemLogMediator } from '#logger/system-log-mediator.js';
import { ModuleExtract } from '#types/module-extract.js';
import { Logger } from '#logger/logger.js';
import { Provider } from '#types/mix.js';
import { RequestContext } from '#services/request-context.js';
import { Providers } from '#utils/providers.js';
import { ConsoleLogger } from '#logger/console-logger.js';
import { SystemErrorMediator } from '#error/system-error-mediator.js';
import { Counter } from '#extension/counter.js';
import { PreRouter } from '#services/pre-router.js';

export const defaultProvidersPerApp: Readonly<Provider[]> = [
  ...new Providers()
    .passThrough(PreRouter)
    .passThrough(SystemLogMediator)
    .passThrough(SystemErrorMediator)
    .useValue(Counter, new Counter())
    .useValue(RequestContext, RequestContext)
    .useValue<ModuleExtract>(ModuleExtract, { moduleName: 'AppModule' })
    .useClass(Logger, ConsoleLogger),
];
