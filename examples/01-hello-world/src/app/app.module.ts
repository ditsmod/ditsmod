import { rootModule, Providers } from '@ditsmod/core';
import { controller, route, initRest } from '@ditsmod/rest';

@controller()
export class DefaultController {
  @route('GET', 'injector-scoped')
  tellHello() {
    return 'ok1';
  }
}

@controller({ scope: 'ctx' })
export class CtxController {
  @route('GET', 'context-scoped')
  tellHello() {
    return 'ok2';
  }
}

@initRest({ controllers: [DefaultController, CtxController] })
@rootModule({ providersPerApp: new Providers().useLogConfig({ level: 'info' }) })
export class AppModule {}
