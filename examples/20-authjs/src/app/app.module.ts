import { controller, rootModule, Providers } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';
import { AuthjsModule } from '@ditsmod/authjs';

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
  imports: [RoutingModule, { path: 'api/auth', module: AuthjsModule }],
  controllers: [DefaultController, SingletonController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
