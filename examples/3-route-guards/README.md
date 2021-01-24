# Route guards

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
