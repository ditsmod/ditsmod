---
sidebar_position: 0
---

# Decorators and Reflector {#decorators-and-reflector}

Let's start with the obvious — TypeScript syntax differs slightly from JavaScript syntax because it provides static typing capabilities. During the compilation of TypeScript code into JavaScript, the compiler can emit additional JavaScript code that can be used to obtain information about the static types of class properties or the static types of parameters in class methods. In other words, when working with TypeScript code, you can first define static types in classes, and then, by using a special API, access information about these static types in the resulting JavaScript code. Decorators signal the TypeScript compiler to emit information about the static types of a class, while the reflector stores and provides access to this information.

In addition to static TypeScript types, decorators also allow you to store additional metadata that can be passed to decorators at the class level, class properties, or method parameters.

In Ditsmod, decorators and the reflector are fundamental components that are used constantly and allow the application to be described declaratively. That's why learning Ditsmod should start with this topic.

Let's try experimenting with preserving static class types. Create a file `src/app/services.ts` in the [ditsmod/rest-starter][101] repository, and paste the following code into it:

```ts
class Service1 {}

class Service2 {
  constructor(service1: Service1) {}
}
```

As you can see, the constructor of `Service2` specifies a static data type for the `service1` parameter. This is a typical example for applications where one class depends on another, and this dependency is declared in the class constructor. Why is it called a dependency? — Because before creating an instance of `Service2`, an instance of `Service1` must be created first.

If you run the command:

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

That is, the information about the parameter type in the `Service2` constructor is lost. This does not suit us, because in this case we will not be able to automatically (programmatically) find out that `Service2` depends on `Service1`. But if we use a class decorator, the TypeScript compiler will output more JavaScript code containing information about static typing. For example, let's use the `injectable` decorator:

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

Fortunately, you will rarely need to inspect the `dist` folder and analyze compiled code, but it can sometimes be useful to glance at it for a general understanding of how static typing is transferred into JavaScript code. The most interesting part is found in the last four lines. It's clear that the TypeScript compiler now associates the array `[Service1]` with `Service2`. This array contains information about the static parameter types detected by the compiler in the `Service2` constructor. It looks like we can now programmatically find out that `Service2` depends on `Service1`. The only thing left to do is find out what APIs Ditsmod provides to store and read this information.

Further analysis of the compiled code indicates that the `Reflect` class is used to store metadata with static typing. At the initial stage of learning Ditsmod, you do not need to dive too deeply into how `Reflect` works, since Ditsmod provides higher-level tools that simplify working with storing and using class metadata.

On the other hand, it is useful to know at least the basics in this area. For example, it is worth knowing that [Reflect][1] is a standard JavaScript class extended with a special API for working with decorators and metadata. This special API is provided by the [reflect-metadata][13] library:

```ts
import 'reflect-metadata/lite';

class Service1 {}

// Store metadata associated with Service1
Reflect.defineMetadata('any-metadata-key', 'some-value', Service1);

// Read previously stored metadata (returns "some-value")
Reflect.getMetadata('any-metadata-key', Service1);
```

As you can see, the extended API in `Reflect` allows attaching metadata to a specific class even without decorators. At the beginning of this script, there is `import 'reflect-metadata/lite'`, through which this library performs so-called "monkey patching", meaning it dynamically adds API methods to the standard `Reflect` class. If you comment out this import, the code will stop working, and you will get an error stating that `Reflect` does not have the `defineMetadata()` method. The same applies to decorators — without `reflect-metadata`, they will stop working as well. This is important to remember during testing when your test file does not import `@ditsmod/core` (which automatically imports `reflect-metadata/lite`). For example, in Jest, you can set the option in the configuration file `setupFilesAfterEnv: ['reflect-metadata/lite']` to avoid manually importing this library.

Now let's take a look at the higher-level tools that Ditsmod provides for working with reflection. We will complicate the previous example to see how metadata can be extracted and how complex dependency chains can be formed. Consider three classes with the following dependency: `Service3` -> `Service2` -> `Service1`. Insert the following code into `src/app/services.ts`:

```ts {15}
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

The `getDependencies()` function uses the reflector and returns an array of direct dependencies of `Service3`. You might guess that by passing `Service2` to `getDependencies()`, we'll see the dependency on `Service1`. This way, you can **automatically** build the entire dependency chain `Service3` -> `Service2` -> `Service1`. This process in DI is called "dependency resolution". And here the word "automatically" is intentionally bolded because it is a very important feature supported by DI. Users only pass `Service3` to DI, and they don't need to manually explore what this class depends on — DI can resolve the dependency automatically. By the way, users will rarely need to use the `getDependencies()` function, except in a few rare cases.

Strictly speaking, the mechanism of storing and retrieving metadata from the reflector using decorators is not yet Dependency Injection. However, Dependency Injection extensively uses decorators and the reflector in its operation, so in this documentation, you might sometimes see that DI "obtains information about class dependencies" although in reality, it's the reflector that does this.

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

[1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect
[13]: https://github.com/ditsmod/ditsmod/blob/3.0.0-next.8/packages/core/package.json#L61
[14]: https://github.com/tc39/proposal-decorators

[101]: ../../#installation
