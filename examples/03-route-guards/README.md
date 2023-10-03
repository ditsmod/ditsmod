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
cd examples/03*
npm start
```

From second terminal:

```bash
curl -i localhost:3000/hello
curl -i localhost:3000/unauth
curl -i localhost:3000/forbidden

# check work controller singleton
curl -i localhost:3000/hello2
curl -i localhost:3000/unauth2
curl -i localhost:3000/forbidden2
```
