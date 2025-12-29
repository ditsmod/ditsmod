---
sidebar_position: 9
---

# LogMediator

In Ditsmod application, you can substitute the default logger with your own logger, and this will allow you to record in your own way even those messages that are issued in `@ditsmod/core`. But changing the logger does not allow you to change the text of the messages themselves and the level of logging (trace, debug, info, warn, error). `LogMediator` (or its child class `SystemLogMediator`) is used for this. Of course, if you have direct access to the code where the logger writes a certain message, then you can change this message on the spot without `LogMediator`. And if the message is issued by the Ditsmod framework itself or its modules, `LogMediator` is essential.

If you want to write a module for a Ditsmod application to publish on, for example, npmjs.com, it is recommended that you use `LogMediator` instead of `Logger`, as users will be able to modify the messages that your module writes.

The Ditsmod repository has an example [11-override-core-log-messages][1] that demonstrates several uses of `LogMediator`. To try this example, you can first clone the repository and install the dependencies:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
cd examples/11-override-core-log-messages
npm start
```

After that, you can directly view and experiment with this example in your editor.

## Extending LogMediator class {#extending-logmediator-class}

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
import { injectable, SystemLogMediator } from '@ditsmod/core';

@injectable()
export class MyLogMediator extends SystemLogMediator {
  /**
   * Custom message: here host: "${host}", and here port: "${port}"
   */
  override serverListen(self: object, host: string, port: number) {
    this.setLog('info', `Custom message: here host: "${host}", and here port: "${port}"`);
  }
}
```

As you can see, `MyLogMediator` extends `LogMediator` and the `serverListen()` method is marked with the `override` keyword because it overrides a parent method with the exact same name. The text of the message that will be recorded in the logs is written in the comments to the method. Almost all `SystemLogMediator` methods pass `this` of the class instance where `SystemLogMediator` is used as the first argument, so that you can easily get the name of that class. The rest of the arguments are arbitrary, everything depends on the context of using these methods.

The result can be seen if you run the application with the `npm start` command, after which you should receive exactly the message that was generated in this `myLogMediator.serverListen()` method.

## LogMediator substitution at the application level {#logmediator-substitution-at-the-application-level}

If you look at `AppModule`, you can see how `LogMediator` is substituted by `MyLogMediator`:

```ts {8-9}
import { SystemLogMediator, rootModule } from '@ditsmod/core';

import { MyLogMediator } from './my-log-mediator.js';

@rootModule({
// ...
  providersPerApp: [
    { token: SystemLogMediator, useToken: MyLogMediator },
    MyLogMediator,
  ],
})
export class AppModule {}
```

In this case, the first element of the array `providersPerApp` will allow using `MyLogMediator` in the Ditsmod core code, the second element - will allow requesting the instance of `MyLogMediator` in the constructors of controllers or services of your application.

Keep in mind that such an application-level substitution works without additional settings only in the root module. If you do this in a feature module, you will additionally have [to resolve the provider collision][100] in the root module (although this is quite simple).

## Module-level substitute of LogMediator {#module-level-substitute-of-logmediator}

As mentioned at the beginning, if you plan to publish your module to other users, it is recommended to use `LogMediator` instead of `Logger`. In this case, users will be able to change the messages written by your module.

To change messages from an external service, `SomeLogMediator` has been extended in `OtherModule` and the method that works in `SomeService` has been overrided. After that, `SomeLogMediator` was substituted to `OtherLogMediator`:

```ts
import { restModule } from '@ditsmod/rest';

import { SomeModule } from '../some/some.module.js';
import { SomeLogMediator } from '../some/some-log-mediator.js';
import { OtherController } from './other.controller.js';
import { OtherLogMediator } from './other-log-mediator.js';

@restModule({
  imports: [SomeModule],
  controllers: [OtherController],
  providersPerMod: [{ token: SomeLogMediator, useClass: OtherLogMediator }],
})
export class OtherModule {}
```




[1]: https://github.com/ditsmod/ditsmod/tree/main/examples/11-override-core-log-messages

[100]: /developer-guides/providers-collisions/
