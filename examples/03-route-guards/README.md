## Preconditions

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git
cd ditsmod
yarn
yarn boot
```

## Route guards

Note the following:

- from `RootModule` exports (in application scope) only `AuthModule`;
- `SomeController` can use services from `AuthModule` without direct import `AuthModule`;
this is because `AuthModule` is exported from `RootModule`;

Check from first terminal:

```bash
yarn start3
```

From second terminal:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/unauth
curl -isS localhost:8080/forbidden
```
