## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git
cd ditsmod
yarn
yarn boot
```

## OpenAPI documentation

Start from first terminal:

```bash
yarn start16
```

Open your browser with http://localhost:3000/openapi and there
should be OpenAPI documentation.

Check from second terminal valid requests:

```bash
curl -isS localhost:3000
curl -isS localhost:3000/resource/123
```

And check invalid requests:

```bash
curl -isS localhost:3000/resource/1d
curl -isS localhost:3000/resource/1d?lng=uk
curl -isS localhost:3000/resource/1d?lng=en
```
