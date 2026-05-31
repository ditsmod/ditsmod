import { rootModule, Providers } from '@ditsmod/core';
import { controller, route, initRest } from '@ditsmod/rest';

@controller()
export class DefaultController {
  @route('GET', 'request-scoped')
  tellHello() {
    return 'ok1';
  }
}

@controller({ scope: 'ctx' })
export class CtxController {
  @route('GET', 'route-scoped')
  tellHello() {
    return 'ok2';
  }
}

@initRest({
  controllers: [DefaultController, CtxController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
@rootModule()
export class AppModule {}
