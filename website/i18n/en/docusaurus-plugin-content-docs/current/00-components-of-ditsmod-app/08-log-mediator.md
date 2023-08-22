---
sidebar_position: 8
---

# LogMediator

In Ditsmod, you can substitute the default logger with your own logger, and this will allow you to record in your own way even those messages that are issued in `@ditsmod/core`. But changing the logger does not allow you to change the text of the messages themselves and the level of logging (trace, debug, info, warn, error). `LogMediator` (or its child class `SystemLogMediator`) is used for this. Of course, if you have direct access to the code where the logger writes a certain message, then you can change this message on the spot without `LogMediator`. And if the message is issued by the Ditsmod framework itself or its modules, `LogMediator` is essential.

If you want to write a module for a Ditsmod application to publish on, for example, npmjs.com, it is recommended that you use `LogMediator` instead of `Logger`, as users will be able to modify the messages that your module writes.

In addition to changing the messages and logging level, `LogMediator` also allows you to filter logs by various parameters. For example, if you enable the most verbose `trace` logs level for the logger, Ditsmod will output a lot of detailed information, and the configuration file for `LogMediator` will allow you to filter messages only for certain modules, or logs written by a certain class or with a certain tag.

The Ditsmod repository has an example [11-override-core-log-messages][1] that demonstrates several uses of `LogMediator`. To try this example, you can first clone the repository and install the dependencies:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
yarn
cd examples/11-override-core-log-messages
yarn start
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

This feature has been available in TypeScript since version 4.3, it allows you to make your code more readable by not allowing you to override properties and methods of the parent class without the word `override`. On the other hand, if a method that is `override` marked in the child class disappears in the parent class, TypeScript will also throw an error with the corresponding hint.

Now let's take a look at `MyLogMediator`:

```ts
import { SystemLogMediator, InputLogFilter } from '@ditsmod/core';

export class MyLogMediator extends SystemLogMediator {
  /**
   * Here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, host: string, port: number) {
    const className = self.constructor.name;
    const inputLogFilter = new InputLogFilter();
    inputLogFilter.className = className;
    this.setLog('info', inputLogFilter, `Here host: "${host}", and here port: "${port}"`);
  }
}
```

As you can see, `MyLogMediator` extends `LogMediator` and the `serverListen()` method is marked with the `override` keyword because it overrides a parent method with the exact same name. The text of the message that will be recorded in the logs is written in the comments to the method. Almost all `SystemLogMediator` methods pass `this` of the class instance where `SystemLogMediator` is used as the first argument, so that you can easily get the name of that class. The rest of the arguments are arbitrary, everything depends on the context of using these methods.

The result can be seen if you run the application with the `yarn start` command, after which you should receive exactly the message that was generated in this `myLogMediator.serverListen()` method.

## Log filtering

As you can see from the previous example, `myLogMediator.serverListen()` uses the `setLog()` method and the `InputLogFilter` class, which have the following types:

```ts
setLog<T extends InputLogFilter>(level: LogLevel, inputLogFilter: T, msg: any): void;

class InputLogFilter {
  className?: string;
  tags?: string[];
}
```

The `InputLogFilter` instance is used as a configuration for further log filtering. To see how this filter works, first change the log output level to `trace` in `AppModule`:

```ts
.useLogConfig({ level: 'trace' }, { modulesNames: ['OtherModule'] })
```

Then run the application with the command `yarn start`, after which you should see logs only from the `OtherModule` module. If you remove the filter with `OtherModule`, you will see a lot of detailed information from all modules.

## Application-level substitute of LogMediator

If you look at `AppModule`, you can see how `LogMediator` is substituted by `MyLogMediator`:

```ts
import { LogMediator } from '@ditsmod/core';

import { MyLogMediator } from './my-log-mediator';
// ...
  providersPerApp: [
    { token: LogMediator, useClass: MyLogMediator },
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
import { featureModule } from '@ditsmod/core';

import { SomeModule } from '../some/some.module';
import { SomeLogMediator } from '../some/some-log-mediator';
import { OtherController } from './other.controller';
import { OtherLogMediator } from './other-log-mediator';

@featureModule({
  imports: [SomeModule],
  controllers: [OtherController],
  providersPerMod: [{ token: SomeLogMediator, useClass: OtherLogMediator }],
})
export class OtherModule {}
```




[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/11-override-core-log-messages
