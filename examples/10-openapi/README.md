## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## OpenAPI documentation

Start from first terminal:

```bash
cd examples/10*
npm run start:dev
```

If you open a browser at http://0.0.0.0:3000/openapi, you will most likely see an error message like:

```text
Failed to load API definition.

Fetch error
Not Implemented http://0.0.0.0:3000/api/openapi.yaml
```

This is due to the fact that the `@ditsmod/openapi` module has a default setting to load API definitions from http://0.0.0.0:3000/api/openapi.yaml. But in the current example application, the API definition is intentionally served at a different address: http://0.0.0.0:3000/openapi.yaml.

To fix this error, you need to pass the `url` parameter: http://0.0.0.0:3000/openapi?url=http://0.0.0.0:3000/openapi.yaml.

You can pass more parameters via query, [see the documentation about this](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/).

For more info see the [docs](https://ditsmod.github.io/en/native-modules/openapi/).
