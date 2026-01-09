---
sidebar_position: 0
---

# Application workflow

As stated in the [application class overview][1], Ditsmod provides an API for writing applications with different architectural styles (REST, tRPC, GraphQL, WebSockets, Microservices, etc.). Initialization starts with creating an instance of the application class, and it is at this stage that the configuration accepted by the application class and the order of its assembly are determined.

The initialization stages of applications with different architectural styles may differ, but as a rule, the following happens:

1. Application scanning using the [ModuleManager][2] starts from the root module.
2. Decorators of the root module, feature modules, and [init decorators][3] allow attaching certain metadata to module classes. During application scanning, this metadata is normalized and validated.
3. Then the [AppInitializer][4] analyzes this metadata, collects providers, and runs extensions.
4. Application initialization is completed in the [Application][1] class, the web server is started, and the application begins operating in normal mode, accepting HTTP requests.


[1]: /basic-components/application/
[2]: /deep-dive/module-manager/
[3]: /deep-dive/init-decorators/
[4]: https://github.com/ditsmod/ditsmod/blob/v3.0.0-alpha.5/packages/core/src/init/base-app-initializer.ts
