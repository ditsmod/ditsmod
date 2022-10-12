# About the project

`@ditsmod/return` - it's Ditsmod module to listen value returned by a controller's route:

```ts
import { Controller, Route } from '@ditsmod/core';

@Controller()
export class HelloWorldController {
  @Route('GET')
  async tellAsyncHello() {
    return 'Hello World!\n';
  }
}
```
