---
sidebar_position: 4
---

# Application

Ditsmod allows you to write applications using different architectural styles:

- [REST][1]
- [REST testing][2]
- [tRPC][3]
- **GraphQL** have not been implemented.
- **WebSockets** have not been implemented.
- **Microservices** have not been implemented.

[Ditsmod provides an API][4] that allows you to add support for the required architecture. Such packages are more than just regular feature modules, since they also include **application classes** that define their own application configuration, their own application build sequence, and so on. As a rule, each of these packages has its own specifics regarding feature modules.

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
[4]: /deep-dive/essentials/
