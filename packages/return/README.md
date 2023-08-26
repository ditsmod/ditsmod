# About the project

`@ditsmod/return` - it's Ditsmod module to listen to value returned by a controller's route.:

```ts
import { controller, Route } from '@ditsmod/core';

@controller()
export class HelloWorldController {
  @Route('GET')
  async tellHello() {
    return 'Hello World!\n';
  }
}
```
