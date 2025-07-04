import { rootModule, Providers } from '@ditsmod/core';
import { controller, route, restMetadata, RestModule } from '@ditsmod/rest';

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

@restMetadata({controllers: [DefaultController, CtxController]})
@rootModule({
  imports: [RestModule],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
