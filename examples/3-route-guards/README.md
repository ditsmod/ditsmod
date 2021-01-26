## Preconditions

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ts-stack/ditsmod.git
cd ditsmod
npm i
```

## Route guards

Note the following:

- from `RootModule` exports (in application scope) only `AuthModule`;
- `SomeController` can use services from `AuthModule` without direct import `AuthModule`;
this is because `AuthModule` is exported from `RootModule`;

Check from first terminal:

```bash
npm run start3
```

From second terminal:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/unauth
curl -isS localhost:8080/forbidden
```
