---
sidebar_position: 0
---

# Decorators and Reflector {#decorators-and-reflector}

Let's start with the obvious — TypeScript syntax is slightly different from JavaScript syntax because it has static typing capabilities. During the compilation of TypeScript code into JavaScript, the compiler can provide additional JavaScript code that can be used to obtain information about static types.

Let's experiment a bit. Create a file `src/app/services.ts` in the [ditsmod/rest-starter][101] repository, and paste the following code into it:

```ts
class Service1 {}

class Service2 {
  constructor(service1: Service1) {}
}
```

As you can see, in the constructor of `Service2`, a static data type is specified for the `service1` parameter. If you run the command:

```bash
npm run build
```

TypeScript code will be compiled and placed into the `dist/app/services.js` file. It will look like this:

```ts
class Service1 {
}
class Service2 {
    constructor(service1) { }
}
```

That is, the information about the parameter type in the `Service2` constructor is lost. But if we use a class decorator, the TypeScript compiler will output more JavaScript code containing information about static typing. For example, let’s use the `injectable` decorator:

```ts {1,5}
import { injectable } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {}
}
```

Now, using the `npm run build` command, the TypeScript compiler converts this code into the following JavaScript code and inserts it into `dist/app/services.js`:

```js {18}
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { injectable } from '@ditsmod/core';
class Service1 {
}
let Service2 = class Service2 {
    constructor(service1) { }
};
Service2 = __decorate([
    injectable(),
    __metadata("design:paramtypes", [Service1])
], Service2);
```

Fortunately, you will rarely need to inspect the `dist` folder and analyze compiled code, but it can sometimes be useful to glance at it for a general understanding of how static typing is transferred into JavaScript code. The most interesting part is found in the last four lines. It’s clear that the TypeScript compiler now associates the array `[Service1]` with `Service2`. This array contains information about the static parameter types detected by the compiler in the `Service2` constructor.

Further analysis of the compiled code shows that the `Reflect` class is used to store metadata with static typing. This class is assumed to be imported from the [reflect-metadata][13] library. The API of this library is then used by Ditsmod to read the above metadata. This process is handled by the so-called **reflector**.

Let’s see what tools Ditsmod provides for working with the reflector. Let’s make the previous example more complex to see how metadata can be extracted and how complex dependency chains can be formed. Consider three classes with the following dependency: `Service3` -> `Service2` -> `Service1`. Insert the following code into `src/app/services.ts`:

```ts
import { injectable, getDependencies } from '@ditsmod/core';

class Service1 {}

@injectable()
class Service2 {
  constructor(service1: Service1) {}
}

@injectable()
class Service3 {
  constructor(service2: Service2) {}
}

console.log(getDependencies(Service3)); // [ { token: [class Service2], required: true } ]
```

The `getDependencies()` function uses the reflector and returns an array of direct dependencies of `Service3`. You might guess that by passing `Service2` to `getDependencies()`, we’ll see the dependency on `Service1`. This way, you can **automatically** build the entire dependency chain `Service3` -> `Service2` -> `Service1`. This process in DI is called "dependency resolution". And here the word "automatically" is intentionally bolded because it is a very important feature supported by DI. Users only pass `Service3` to DI, and they don’t need to manually explore what this class depends on — DI can resolve the dependency automatically. By the way, users will rarely need to use the `getDependencies()` function, except in a few rare cases.

Strictly speaking, the mechanism of storing and retrieving metadata from the reflector using decorators is not yet Dependency Injection. However, Dependency Injection extensively uses decorators and the reflector in its operation, so in this documentation, you might sometimes see that DI "obtains information about class dependencies" although in reality, it’s the reflector that does this.

The code in the last example can be compiled and run with the following command:

```bash
tput reset && npm run build && node dist/app/services.js
```

To have the code automatically execute after every change, you can use two terminals. In the first terminal, you can run the command to compile the code:

```bash
npm run build -- --watch
```

And in the second terminal, you can run the command to execute the compiled code:

```bash
node --watch dist/app/services.js
```

Now, if in `src/app/services.ts` you pass `Service2` to the `getDependencies()` function, after a few seconds, you should see the output `[ { token: [class Service1], required: true } ]` in the second terminal.


[13]: https://github.com/ditsmod/ditsmod/blob/core-2.54.0/packages/core/package.json#L53

[101]: ../../#installation
