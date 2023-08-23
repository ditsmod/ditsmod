## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## Route guards

Note the following:

- from `rootModule` exports (in application scope) only `AuthModule`;
- `SomeController` can use services from `AuthModule` without direct import `AuthModule`;
this is because `AuthModule` is exported from `rootModule`;

Start from first terminal:

```bash
npm start
```

From second terminal:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/unauth
curl -isS localhost:3000/forbidden
```
