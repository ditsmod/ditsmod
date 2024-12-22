import { controller, rootModule, Providers } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import { AuthjsModule } from '@ditsmod/authjs';
import GitHub from '@auth/core/providers/github';

@controller()
export class DefaultController {
  @route('GET', 'default-controller')
  tellHello() {
    return 'Hello, World!';
  }

  @route(['GET', 'POST'], 'method-name-as-symbol')
  [Symbol()]() {
    return 'Hello, World!';
  }
}

@controller({ scope: 'module' })
export class SingletonController {
  @route('GET', 'singleton-controller')
  tellHello() {
    return 'Hello, World!';
  }
}

@rootModule({
  imports: [RoutingModule, AuthjsModule.withParams('api/auth', { providers: [GitHub] })],
  controllers: [DefaultController, SingletonController],
  providersPerApp: new Providers().useLogConfig({ level: 'info', showExternalLogs: true }),
})
export class AppModule {}
