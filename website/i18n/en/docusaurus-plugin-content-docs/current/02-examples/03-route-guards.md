# 03-route-guards

To try this example, you should first [prepare the prerequisite][1].

In this example, `SomeModule` is imported into the root module, where there is a controller with
secure routes. Protection of these routes occurs with the help of [guards][103]. These guards are
declared in `AuthModule`, and the module itself is exported from root module without import to it.
The export of modules concerns only the increase of the scope of providers for DI. It doesn't make
sense to export modules if you are not going to increase the scope of the providers declared in
them.

However, if you do [export a specific module from the root module][102], the scope of its providers
may increase by the entire application. This is exactly what happens in the `AuthModule` module.

`SomeController` shows two options for using guards. The first option without arguments:

```ts
@Route('GET', 'unauth', [AuthGuard])
throw401Error() {
  this.res.send('some secret');
}
```

The second option with arguments:

```ts
@Route('GET', 'forbidden', [[PermissionsGuard, Permission.canActivateAdministration]])
throw403Error() {
  this.res.send('some secret');
}
```

You can run the application from the first terminal:

```bash
yarn start3
```

From the second terminal check the work:

```bash
curl -isS localhost:8080
curl -isS localhost:8080/unauth
curl -isS localhost:8080/forbidden
```

[1]: ./prerequisite
[102]: ../core/exports-and-imports#export-of-the-providers-from-the-root-module
[103]: ../core/guards
