# 11-override-core-log-messages

In Ditsmod, you can replace the default logger with your own logger, so you can record in your own way even those messages issued in `@ditsmod/core`. But changing the logger does not allow you to change the text of the messages themselves and the level of logging (trace, debug, info, warn, error). `LogMediator` is used for this. Of course, if you have direct access to the code where the logger writes a certain message, then you can change this message on the spot without `LogMediator`. And if the message is issued by the Ditsmod framework itself or its modules, `LogMediator` cannot be dispensed with.

If you want to write a module for a Ditsmod application to publish on, for example, npmjs.com, it is recommended that you use `LogMediator` instead of `Logger`, as users will be able to modify the messages that your module writes.

In addition to changing the messages and logging level, `LogMediator` also allows you to filter logs by various parameters. For example, if you enable the most verbose `trace` logs level for the logger, Ditsmod can output a lot of detailed information, and the configuration file for `LogMediator` will allow you to filter messages only for certain modules.

The Ditsmod repository has a custom example [11-override-core-log-messages][1] that demonstrates several uses of `LogMediator`. To try this example, you can first clone the repository and install the dependencies:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
yarn
```

After that, you can directly view and experiment with this example in your editor.

## Extending LogMediator class

Since this example extends the class, it uses the recommended TypeScript setting in `tsconfig.json`:

```json
{
  "compilerOptions": {
    // ...
    "noImplicitOverride": true,
    // ...
  },
  // ...
}
```

This feature has been available in TypeScript since version 4.3, it allows you to make your code more readable by not allowing you to override methods of the parent class without the word `override`. On the other hand, if a method that is `override` marked in the child class disappears in the parent class, TypeScript will also throw an error with the corresponding hint.

Now let's take a look at `MyLogMediator`:

```ts
import { LogMediator, MsgLogFilter } from '@ditsmod/core';

export class MyLogMediator extends LogMediator {
  /**
   * Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, serverName: string, host: string, port: number) {
    const className = self.constructor.name;
    const msgLogFilter = new MsgLogFilter();
    msgLogFilter.classesNames = [className];
    this.setLog('info', msgLogFilter, `Here serverName: "${serverName}", here host: "${host}", and here port: "${port}"`);
  }
}
```

As you can see, `MyLogMediator` extends `LogMediator` and the `serverListen()` method is marked with the `override` keyword because it overrides a parent method with the exact same name. The text of the message that will be recorded in the logs is written in the comments to the method. Any `LogMediator` method (for logging) is always passed the `this` of the instance of the class using the `LogMediator` as its first argument, so that the name of that class can be easily retrieved. The rest of the arguments are arbitrary, everything depends on the context of using these methods.

The result can be seen if you run the application with the `yarn start11` command, after which you should receive exactly the message that was generated in this `myLogMediator.serverListen()` method.

## Log filtering

As you can see from the previous example, `myLogMediator.serverListen()` uses the `setLog()` method and the `MsgLogFilter` class, which have the following types:

```ts
setLog<T extends MsgLogFilter>(level: LogLevel, msgLogFilter: T, msg: any): void;

class MsgLogFilter {
  className?: string;
  tags?: string[];
}
```

The `MsgLogFilter` instance is used to enable further log filtering. To see how these filters work, first change the log output level to `trace' in `AppModule`:

```ts
.useValue(LoggerConfig, new LoggerConfig('trace'))
```

Then run the application with the `yarn start11` command, after which you should see a lot of logs. Now uncomment the following line and you should see logs only from the `OtherModule` module:

```ts
.useValue(LogFilter, { modulesNames: ['OtherModule'] })
```

## Application-level substitute of LogMediator

If you look at `AppModule`, you can see how `LogMediator` is substituted by `MyLogMediator`:

```ts
import { LogMediator } from '@ditsmod/core';

import { MyLogMediator } from './my-log-mediator';
// ...
  providersPerApp: [
    { provide: LogMediator, useClass: MyLogMediator },
    MyLogMediator,
  ],
// ...
export class AppModule {}
```

In this case, the first element of the array `providersPerApp` will allow using `MyLogMediator` in the Ditsmod core code, the second element - will allow requesting the instance of `MyLogMediator` in the constructors of controllers or services of your application.

## Module-level substitute of LogMediator

As mentioned at the beginning, if you plan to publish your module to other users, it is recommended to use `LogMediator` instead of `Logger`. In this case, users will be able to change the messages written by your module, as well as filter them.

In this example, `SomeModule` has `SomeService`, which uses `SomeLogMediator`. You can imagine that `SomeModule` is an external module that is supposedly installed via a package manager (npm, yarn, etc.) and therefore you have "read-only" access to it. `SomeModule` is imported into `OtherModule`, which calls the external service `SomeService`, which in turn calls `SomeLogMediator`.

To change messages from an external service, `SomeLogMediator` has been extended in `OtherModule` and the method that works in `SomeService` has been overrided. After that, `SomeLogMediator` was substituted to `OtherLogMediator`:

```ts
import { Module } from '@ditsmod/core';

import { SomeModule } from '../some/some.module';
import { SomeLogMediator } from '../some/some-log-mediator';
import { OtherController } from './other.controller';
import { OtherLogMediator } from './other-log-mediator';

@Module({
  imports: [SomeModule],
  controllers: [OtherController],
  providersPerMod: [{ provide: SomeLogMediator, useClass: OtherLogMediator }],
})
export class OtherModule {}
```




[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/11-override-core-log-messages
