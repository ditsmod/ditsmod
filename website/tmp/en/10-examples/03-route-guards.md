# 03-route-guards

To try this example, you should first [prepare the prerequisite][1].

In this example, `SomeModule` is imported into the root module, which has a controller with protected routes. Protection of these routes takes place with the help of [guards][103]. These guards are in `AuthModule`, and the module itself is exported from the root module. Exporting modules only applies to providers for DI. There's no point in exporting modules if you don't need providers from them.

However, if you [export a specific module from the root module][102], its providers are copied to every application module. This is exactly what happens in the `AuthModule` module.

`SomeController` shows two options for using guards. The first option without arguments:

```ts
@route('GET', 'unauth', [AuthGuard])
throw401Error(res: Res) {
  res.send('some secret');
}
```

The second option with arguments:

```ts
@route('GET', 'forbidden', [[PermissionsGuard, Permission.canActivateAdministration]])
throw403Error(res: Res) {
  res.send('some secret');
}
```

You can run the application from the first terminal:

```bash
npm start
```

From the second terminal check the work:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/unauth
curl -isS localhost:3000/forbidden
```

[1]: /examples/prerequisite
[102]: /developer-guides/exports-and-imports#export-of-the-providers-from-the-root-module
[103]: /components-of-ditsmod-app/guards
