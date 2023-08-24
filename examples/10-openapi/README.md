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
npm start
```

Open your browser with http://localhost:3000/openapi and there
should be OpenAPI documentation.

Check from second terminal:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/resource/123
```

For more info see the [docs](https://ditsmod.github.io/en/published-modules/openapi)
