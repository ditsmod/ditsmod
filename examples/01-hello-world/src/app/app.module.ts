import { rootModule, Providers } from '@ditsmod/core';
import { controller, route, routingMetadata, RoutingModule } from '@ditsmod/routing';

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

@routingMetadata({ controllers: [DefaultController, CtxController] })
@rootModule({
  imports: [RoutingModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
