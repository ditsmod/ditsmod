## Prerequisites

If you haven't prepared the examples repository yet, you can do so:

```bash
git clone https://github.com/ditsmod/ditsmod.git
cd ditsmod
npm i
```

## OPTIONS, CORS, CORS preflight

Start from first terminal:

```bash
cd examples/17*
npm run start:dev
```

From second terminal:

```bash
# Simply OPTIONS request
curl -i localhost:3000 -X OPTIONS

# OPTIONS CORS request
curl -i localhost:3000 -X OPTIONS -H 'Origin: https://example.com'

# GET CORS request
curl -i localhost:3000 -H 'Origin: https://example.com'

# Preflighted CORS request
curl -i localhost:3000 \
-X OPTIONS \
-H 'Origin: https://example.com' \
-H 'Access-Control-Request-Method: POST' \
-H 'Access-Control-Request-Headers: X-PINGOTHER, Content-Type'

# CORS request with credentials
curl -i localhost:3000/credentials -H 'Origin: https://example.com'
```

For more info see:

- [OPTIONS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS)
- [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [CORS Preflight](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
