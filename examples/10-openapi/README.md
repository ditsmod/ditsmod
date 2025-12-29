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

Open your browser with http://localhost:3000/openapi and there should be OpenAPI documentation.

Check from second terminal:

```bash
curl -i localhost:3000
curl -i localhost:3000/resource/123
```

For more info see the [docs](https://ditsmod.github.io/en/rest-application/native-modules/openapi/).
