import { rootModule, Providers, LoggerConfig } from '@ditsmod/core';
import { controller, route, initRest } from '@ditsmod/rest';

@controller()
export class RequestScopedController {
  @route('GET', 'request-scoped')
  tellHello() {
    return 'ok1';
  }
}

@controller({ scope: 'route' })
export class RouteScopedController {
  @route('GET', 'route-scoped')
  tellHello() {
    return 'ok2';
  }
}

@initRest({
  controllers: [RequestScopedController, RouteScopedController],
  providersPerApp: new Providers().useValue(LoggerConfig, { level: 'info' }),
})
@rootModule()
export class AppModule {}
