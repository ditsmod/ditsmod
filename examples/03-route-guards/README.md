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

Prepare the example:

```bash
cd examples/03*
cp .env-example .env
```

Start from first terminal:

```bash
npm run start:dev
```

From second terminal:

```bash
curl -i localhost:3000/controler1-of-module1
curl -i localhost:3000/unauth
curl -i localhost:3000/forbidden

# check work controller singleton
curl -i localhost:3000/controler2-of-module1
curl -i localhost:3000/unauth2
curl -i localhost:3000/forbidden2
```

To test authentication with BasicGuard, open a browser at [http://0.0.0.0:3000/basic-auth](http://0.0.0.0:3000/basic-auth) and enter username: `demo` and password: `p@55w0rd`. You can change the username and password in the `.env` file and then you need restart the application.

We also recommend paying attention to how the `dotenv` module is included in the `package.json` and `vitest.config.ts` files.
