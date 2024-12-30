import { controller, rootModule, Providers } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';

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

@rootModule({
  imports: [RoutingModule],
  controllers: [DefaultController, CtxController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
