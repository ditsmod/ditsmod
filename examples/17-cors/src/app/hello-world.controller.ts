import { Controller, Providers, Res, Route } from '@ditsmod/core';
import { CorsOptions } from '@ts-stack/cors';

@Controller({
  providersPerRou: [
    ...new Providers()
      .useLogConfig({ level: 'info' })
      .useValue<CorsOptions>(CorsOptions, { origin: 'https://mblog.dev' })
  ]
})
export class HelloWorldController {
  constructor(private res: Res) {}

  @Route('OPTIONS')
  tellHello() {
    this.res.send('Hello World!\n');
  }
}
