import { LoggerConfig, Providers } from '@ditsmod/core';
import { controller, route, restRootModule } from '@ditsmod/rest';

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

@restRootModule({
  controllers: [RequestScopedController, RouteScopedController],
  providersPerApp: new Providers().useValue(LoggerConfig, { level: 'info' }),
})
export class AppModule {}
