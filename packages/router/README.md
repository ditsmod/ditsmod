## @ditsmod/router

This is a fork of [koa-tree-router](https://github.com/steambap/koa-tree-router/tree/ad5ecb).

## Install

```bash
yarn add @ts-stack/di @ditsmod/router
# OR
yarn add @ts-stack/di @ditsmod/router
```

Where [@ts-stack/di](https://github.com/KostyaTretyak/@ts-stack/di) is a dependencie.

## Usage

```ts
import { Router, Tree } from '@ditsmod/router';
import { ReflectiveInjector } from '@ts-stack/di'; // This is a dependency

const injector = ReflectiveInjector.resolveAndCreate([Tree, Router]);
const router = injector.get(Router) as Router;
router.on('GET', '/', () => { /* Here some handler */ });
const { handle, params } = router.find('GET', '/');
```

## Benchmarks

```bash
git clone git@github.com:ditsmod/ditsmod-plugins.git
cd ditsmod-plugins/src/router
yarn
yarn boot
yarn build
yarn bench
```

Results on 22.02.2020:

```text
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Running in random order
============================================================
Lib                   | Bench, ops/sec | Memory usage, KB
============================================================
@ditsmod/router      | 4,372,262      | 4,420
------------------------------------------------------------
koa-tree-router       | 4,257,653      | 4,281
------------------------------------------------------------
trek-router           | 3,416,613      | 4,758
------------------------------------------------------------
find-my-way           | 2,512,956      | 4,940
------------------------------------------------------------
```
