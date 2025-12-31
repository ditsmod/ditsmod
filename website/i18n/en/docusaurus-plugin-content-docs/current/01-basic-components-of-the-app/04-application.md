---
sidebar_position: 4
---

# Application

Ditsmod allows you to write applications using different architectural styles:

- [REST][1]
- [REST testing][2]
- [tRPC][3]
- **GraphQL** has not been implemented yet, but is planned (possibly in Ditsmod v4). Although you can already use the [Ditsmod API][4] to write your own implementation of GraphQL support.
- **WebSockets** have not been implemented, but [Ditsmod provides an API][4] that allows adding support for this architecture.
- **Microservices** have not been implemented, but [Ditsmod provides an API][4] that allows adding support for this architecture.

Such packages are more than just regular feature modules, since they also include **application classes** that define their own application configuration, their own application build sequence, their own application runtime behavior, and so on. As a rule, each of these packages has its own specifics regarding feature modules.

At the initial stage of learning Ditsmod, it is sufficient to know that this framework is capable of supporting different architectural styles. If you want to implement your own version of a particular architectural style, you will need to [deeply dive into studying Ditsmod][4].

An instance of the **application class** is typically created in the `main.ts` file, and the application starts working from there. For example, an instance of a REST application class is created as follows:

```ts {4} title="src/main.ts"
import { RestApplication } from '@ditsmod/rest';
import { AppModule } from './app/app.module.js';

const app = await RestApplication.create(AppModule);
app.server.listen(3000, '0.0.0.0');
```

[1]: /rest-application/rest-module/
[2]: /rest-application/native-modules/testing/
[3]: /trpc-application/trpc-module/
[4]: /deep-dive/intro/
