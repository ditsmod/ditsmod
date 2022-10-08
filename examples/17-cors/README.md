## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone git@github.com:ditsmod/ditsmod.git
cd ditsmod
yarn
yarn boot
```

## Hello world

Start from first terminal:

```bash
yarn start17
```

From second terminal:

```bash
# Simply OPTIONS request
curl -isS localhost:3000 -X OPTIONS

# OPTIONS CORS request
curl -isS localhost:3000 -X OPTIONS -H "Origin: https://example.com"

# GET CORS request
curl -isS localhost:3000 -H "Origin: https://example.com"

# PrePreflighted CORS request
curl -isS localhost:3000 \
-X OPTIONS \
-H "Origin: https://example.com" \
-H 'Access-Control-Request-Method: POST' \
-H 'Access-Control-Request-Headers: X-PINGOTHER, Content-Type'
```

For more info see:

- [OPTIONS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS)
- [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [CORS Preflight](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
