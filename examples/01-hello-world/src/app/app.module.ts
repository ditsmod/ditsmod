import { controller, Res, rootModule, Providers, SingletonRequestContext } from '@ditsmod/core';
import { route, RoutingModule } from '@ditsmod/routing';

@controller()
export class DefaultController {
  @route('GET', 'default-controller')
  tellHello(res: Res) {
    res.send('Hello, World!');
  }

  @route(['GET', 'POST'], 'method-name-as-symbol')
  [Symbol()](res: Res) {
    res.send('Hello, World!');
  }
}

@controller({ scope: 'module' })
export class SingletonController {
  @route('GET', 'singleton-controller')
  tellHello(ctx: SingletonRequestContext) {
    ctx.send('Hello, World!');
  }
}

@rootModule({
  imports: [RoutingModule],
  controllers: [DefaultController, SingletonController],
  providersPerApp: new Providers().useLogConfig({ level: 'info' }),
})
export class AppModule {}
