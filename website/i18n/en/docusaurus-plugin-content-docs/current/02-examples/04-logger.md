# 04-logger

To try this example, you should first [prepare the prerequisite][1].

In this example, it is shown how it is possible to have four loggers in one application:

- `ConsoleLogger`;
- [bunyan][6];
- [pino][7];
- [winston][5];

In practice, such an example is unlikely to be needed, but it demonstrates the operation of a hierarchical DI architecture, export/import providers, a default logger substitution mechanism, and a default logger configuration.

In `PinoModule`,` BunyanModule` and `WinstonModule` the substitution default of the logger is made, and it is done in `providersPerMod` array. That is why the controllers in these modules will use pino, bunyan and winston respectively.

It should be noted that constructors of any class use the default logger as a [token][104], and DI substitutes different loggers for different controllers.

```ts
import { Controller, Logger, Res, Route } from '@ditsmod/core';

// ...
constructor(private res: Res, private log: Logger) {}
// ...
```

You can run the application from the first terminal:

```bash
yarn start4
```

From the second terminal check the work:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/pino
curl -isS localhost:3000/winston
curl -isS localhost:3000/bunyan
```

[1]: ./prerequisite
[5]: https://github.com/winstonjs/winston
[6]: https://github.com/trentm/node-bunyan
[7]: https://github.com/pinojs/pino

[104]: ../core/dependency-injection#di-tokens
